import * as fs from 'fs';
import * as path from 'path';
import { App, BrowserWindow, BrowserWindowConstructorOptions, dialog, FileFilter, ipcMain, Menu, MenuItemConstructorOptions, OpenDialogSyncOptions, SaveDialogSyncOptions } from 'electron';
// import debug from 'electron-debug';
import log from 'electron-log';
// import reloader from 'electron-reloader';

import { ElectronEvent } from './enums';
import { Logger } from './logger';
import { RecentItem } from './model';
import { MenuStateService, PdfExportService, RecentlyOpenedService, StylesheetService } from './services';
import { AppInfo } from './shared/app-info';
import { Channel, MenuCommand, MenuId, RendererEvent, RendererRequest } from './shared/enums';
import { configureLogging } from './shared/log-config';
import { MenuItemState } from './shared/menu-item-state';
import { convertToText } from './shared/string';

export class Application {
  public readonly isMac: boolean;
  private _mainWindow: BrowserWindow | undefined;
  private _menuStateService: MenuStateService = MenuStateService.instance;
  private _recentlyOpenedService: RecentlyOpenedService = RecentlyOpenedService.instance;
  private _stylesheetService: StylesheetService;
  private _pdfExportService: PdfExportService = PdfExportService.instance;
  private _debugMode: boolean;
  private _appInfo: AppInfo;
  private _emptyMenuState: MenuItemState[] = [
    /* Menu state when no tabs are open */
    {
      id: MenuId.SaveAsPdf,
      enabled: false
    }
  ];
  private readonly _log: Logger;

  constructor(private _electronApp: App) {
    configureLogging(log);

    this._log = new Logger('Application');
    this.isMac = process.platform === 'darwin';
    this._debugMode = !_electronApp.isPackaged;
    this._appInfo = {
      appName: _electronApp.getName()
    };
    this._stylesheetService = StylesheetService.instance(_electronApp.getPath('userData'));

    _electronApp.on(ElectronEvent.Activate, this.onElectronActivate);
    _electronApp.on(ElectronEvent.BeforeQuit, this.onElectronBeforeQuit);
    _electronApp.on(ElectronEvent.WindowAllClosed, this.onElectronWindowAllClosed);
  }

  public initialize(): void {
    this.createMainWindow();

    ipcMain.handle(Channel.RendererRequest, (_event, ...args) => this.handleRendererRequest(...args));
    ipcMain.on(Channel.RendererEvent, (_event, ...args) => this.handleRendererEvent(...args));
  }

  private createMainWindow(): void {
    if (this._mainWindow) {
// TODO: make sure main window is closed?
      this._mainWindow = undefined;
    }

    Menu.setApplicationMenu(null);
    const menu: Menu = this.createMainMenu();
    Menu.setApplicationMenu(menu);

    this._recentlyOpenedService.recentlyOpened$
                               .subscribe(recentItems => {
                                  /* There's currently no way to remove items from a menu so the
                                    only practical option is to recreate the menu and reassign it.
                                  */
                                  const updateMenu: Menu = this.createMainMenu(recentItems);
                                  Menu.setApplicationMenu(updateMenu);
                                });

    const mainWindow: BrowserWindow = new BrowserWindow({
// TODO: restore previous window size
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: this._debugMode,
        contextIsolation: false  // false if you want to run e2e test with Spectron
      }
    });

    mainWindow.webContents.setWindowOpenHandler(details => {
      const options: BrowserWindowConstructorOptions = JSON.parse(details.features);
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          fullscreenable: false,
          skipTaskbar: true,
          ...options
        }
      };
    });

    const appUrl: string = this.getBrowserAppUrl();
    this._log.info(`Loading from ${appUrl}`);
    mainWindow.loadURL(appUrl)
              .then(() => {
                this.onMainWindowCreated(mainWindow);
              }, (error) => {
                this._log.error(`Failed to load ${appUrl} into main window`, error);
// TODO: need to display the error message somehow
// TODO: delete window?
                // mainWindow.destroy();
              });
  }

  private createMainMenu(recentItems: RecentItem[] = []): Menu {
    const recentlyOpenedMenuTemplate: Array<MenuItemConstructorOptions> = this.createRecentlyOpenedMenuTemplate(recentItems);
    const template: Array<MenuItemConstructorOptions> = [
      {
        /* IMPORTANT!  Changing the menus here?  Don't forget to update MenuStateService.disableMainMenu()
          to account for those changes.
        */
        id: MenuId.File,
        label: 'File',
        submenu: [
          {
            id: MenuId.FileOpen,
            label: 'Open...',
            click: (): void => { this.onOpenMarkdownFile() }
          },
          {
            id: MenuId.FileOpenRecent,
            label: 'Open Recent',
            submenu: recentlyOpenedMenuTemplate
          },
          {
            id: MenuId.SaveAsPdf,
            label: 'Save as PDF...',
            enabled: false,
            click: (): void => { this.sendMenuCommand(MenuCommand.SaveAsPdf) }
          },
          { type: 'separator' },
          this.isMac ? {
                        id: MenuId.FileExit,
                        role: 'close'
                       }
                     : {
                        id: MenuId.FileExit,
                        role: 'quit'
                       }
        ]
// TODO: not needed (for now)
      // },
      // {
      //   id: MenuId.Edit,
      //   role: 'editMenu'
      }
    ];

    if (this.isMac) {
      template.unshift({
                        id: MenuId.Application,
                        label: this._electronApp.name,
                        submenu: [
                          { role: 'about' },
                          { type: 'separator' },
                          { role: 'services' },
                          { type: 'separator' },
                          { role: 'hide' },
                          { role: 'hideOthers' },
                          { role: 'unhide' },
                          { type: 'separator' },
                          { role: 'quit' }
                        ]
                      });
    }

    return Menu.buildFromTemplate(template);
  }

  private createRecentlyOpenedMenuTemplate(recentItems: RecentItem[]): Array<MenuItemConstructorOptions> {
    const template: Array<MenuItemConstructorOptions> = [];

    if (recentItems.length > 0) {
      recentItems.forEach(recentItem => {
        template.push({
                  label: recentItem.label,
                  click: (): void => { this.onOpenMarkdownFile(recentItem.label) }
                });
      });

      template.push({ type: 'separator' });
    }

    template.push({
              label: 'Clear Recently Opened',
              enabled: (recentItems.length > 0),
              click: (): void => { this._recentlyOpenedService.clear() }
            });

    return template;
  }

  // private setUpContextMenuForEditing(mainWindow: BrowserWindow): void {
  //   /* Rather than constructing the edit menu manually, we'll just use the 'editmenu' role to
  //     create the required items for us and then use that.
  //   */
  //   const contextMenu: Menu = Menu.buildFromTemplate([
  //     { role: 'editMenu' }
  //   ]);
  //   const editMenu: Menu | undefined = contextMenu.items[0].submenu;

  //   if (editMenu) {
  //     mainWindow.webContents.on(ElectronEvent.ContextMenu, (_e, props) => {
  //       const { selectionText, isEditable } = props;

  //       if ((selectionText && selectionText.length > 0) || isEditable) {
  //         this._menuStateService.setEditMenuItemsState(editMenu, props);
  //         editMenu.popup({ window: mainWindow });
  //       }
  //     });
  //   }
  // }

  private getBrowserAppUrl(): string {
    let appUrl: string;

    if (this._debugMode) {
      // debug();
      // reloader(module);
      appUrl = 'http://localhost:4200';
    } else {
      let pathIndex: string = './index.html';    // Path when running electron executable

      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';      // Path when running electron in local folder
      }

      const url: URL = new URL(path.join('file:', __dirname, pathIndex));
      appUrl = url.toString();
    }

    return appUrl;
  }

  private onMainWindowCreated(mainWindow: BrowserWindow): void {
    mainWindow.on(ElectronEvent.Closed, () => {
      /* Dereference the window object, usually you would store window
        in an array if your app supports multiple windows, this is the time
        when you should delete the corresponding element.
      */
      this._mainWindow = undefined;
    });

    this._mainWindow = mainWindow;
    this._mainWindow.webContents.send(Channel.AppInfo, this._appInfo);
    // this.setUpContextMenuForEditing(mainWindow);

    if (this._debugMode) {
      mainWindow.webContents.openDevTools();
    }
  }

  private sendMenuCommand(menuCommand: MenuCommand, ...args: any[]): void {
    if (this._mainWindow) {
      this._mainWindow.webContents.send(Channel.MenuCommand, menuCommand, ...args);
    }
  }

  private handleRendererRequest = (...args: any[]): Promise<any> => {
    const request: RendererRequest = args[0];

    switch (request) {
      case RendererRequest.GetAvailableStylesheets:
        return this.getAvailableStylesheets();

      case RendererRequest.GetStylesheet: {
        const [, filepath] = args;
        return this.getStylesheet(filepath);
      }
      default: {
        const message: string = `Unsupported RendererRequest - ${convertToText(args)}`;
        this._log.error(message);
// TODO: need to display the error message somehow
        return Promise.reject(new Error(message));
      }
    }
  };

  private getAvailableStylesheets(): Promise<string[]> {
    const stylesheets: string[] = this._stylesheetService.getStylesheets();
    return Promise.resolve(stylesheets);
  }

  private getStylesheet(filepath: string): Promise<string> {
    const stylesheet: string = this._stylesheetService.getStylesheet(filepath);
    return Promise.resolve(stylesheet);
  }

  private handleRendererEvent = (...args: any[]): void => {
    const event: RendererEvent = args[0];

    switch (event) {
      case RendererEvent.ModalOpened:
        this.onModalOpened();
        break;

      case RendererEvent.ModalClosed:
        this.onModalClosed();
        break;

      case RendererEvent.SaveAsPdf: {
        const [, filepath, html] = args;
        if (filepath && html) {
          this.onSaveAsPdf(filepath, html);
        } else {
          this._log.error('\'SaveAsPdf\' renderer event received without filepath/html');
// TODO: need to display the error message somehow
        }
        break;
      }
      case RendererEvent.TabChanged: {
        const [, menuState] = args;
        this._menuStateService.setState(menuState ?? this._emptyMenuState);
        break;
      }
      default:
        this._log.error(`Unsupported RendererEvent - ${convertToText(args)}`);
// TODO: need to display the error message somehow
        break;
    }
  };

  private onModalOpened(): void {
    this._menuStateService.setMainMenuState(false);
  }

  private onModalClosed(): void {
    this._menuStateService.setMainMenuState(true);
  }


  private onOpenMarkdownFile(filepath?: string): void {
    if (typeof(filepath) === 'undefined') {
      filepath = this.promptForMarkdownFile();
    }

    if (filepath) {
      try {
        fs.readFile(filepath,
                    (err: NodeJS.ErrnoException | null, data: Buffer) => {
                      if (err === null) {
                        const contents: string = data.toString(); /* Using 'utf8' by default */
                        this.sendMenuCommand(MenuCommand.OpenMarkdown, filepath, contents);
                        this._recentlyOpenedService.add({ label: filepath ?? '' }); /* shouldn't be undefined, but just in case */
                      } else {
// TODO: need to display the error message somehow
                        this._log.error(`Failed to open/read file contents of ${filepath}`, err);
                      }
                    });
// TODO: need to display progress message/change cursor????
      } catch (err) {
// TODO: need to display the error message somehow
        this._log.error('Failed to open file', err);
      }
    }
  }

  private promptForMarkdownFile(): string | undefined {
    let filepath: string | undefined;

    if (this._mainWindow) {
      const filters: FileFilter[] = [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ];
      const options: OpenDialogSyncOptions = {
        // title?: string;
        // defaultPath?: string;
        // buttonLabel?: string;
        filters,
        properties: ['openFile']
        // message?: string; // mac only
        // securityScopedBookmarks?: boolean; // mac only
      };
      const filepaths: string[] | undefined = dialog.showOpenDialogSync(this._mainWindow, options);

      if (filepaths) {
        this._log.assert(filepaths.length === 1, 'Multiple files selected from OpenFileDialog');
        filepath = filepaths[0];
      }
    } else {
      this._log.warn('Main window has not been instantiated');
    }

    return filepath;
  }

  private onSaveAsPdf(mdFilepath: string, html: string): void {
    const pdfFilepath: string | undefined = this.promptForPdfFile(mdFilepath);

    if (pdfFilepath) {
      try {
        this._pdfExportService.export(pdfFilepath, html);
      } catch (err) {
// TODO: need to display the error message somehow
        this._log.error(`Failed to export ${mdFilepath} as PDF`, err);
      }
    }
  }

  private promptForPdfFile(mdFilepath: string): string | undefined {
    let pdfFilepath: string | undefined;

    if (this._mainWindow) {
      /* Provide a default PDF filename matching the original MD file */
      const mdPath: path.ParsedPath = path.parse(mdFilepath);
      mdPath.base = '';   /* Otherwise, this is reused, rather than `name` and `ext` */
      mdPath.ext = '.pdf';
      pdfFilepath = path.format(mdPath);

      const filters: FileFilter[] = [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ];
      const options: SaveDialogSyncOptions = {
        // title?: string;
        defaultPath: pdfFilepath,
        // buttonLabel?: string;
        filters,
        // message?: string;
        // nameFieldLabel?: string;
        // showsTagField?: boolean;
        properties: [/*'createDirectory' |*/ 'showOverwriteConfirmation']
        // securityScopedBookmarks?: boolean; // mac only
      };

      pdfFilepath = dialog.showSaveDialogSync(this._mainWindow, options);
    } else {
      this._log.warn('Main window has not been instantiated');
    }

    return pdfFilepath;
  }

  private onElectronActivate = (): void => {
    /* On OS X, it's common to re-create a window in the app when the
      dock icon is clicked and there are no other windows open.
    */
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  };

  private onElectronWindowAllClosed = (): void => {
    /* On OS X, it's common for applications and their menu bar
      to stay active until the user quits explicitly with Cmd + Q.
    */
    if (!this.isMac) {
      this._electronApp.quit();
    }
  };

  private onElectronBeforeQuit = (): void => {
    this._pdfExportService.close();
  };
}
