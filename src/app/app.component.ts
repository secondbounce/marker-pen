import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { Channel, MenuCommand, RendererEvent } from '~shared/enums';
import { SAMPLE_MARKDOWN } from '~shared/sample-constants';
import { environment } from '../environments/environment';
import { Logger, MarkdownFile, StateChange } from './core/model';
import { StateChangeType, ToolbarControlId } from './enums';
import { ElectronService, LogService, SettingsService, TabManagerService } from './services';
import { ToolbarComponent, ToolbarControlResult, ToolbarControls, ToolbarControlType, ToolbarDropdownOption, ToolbarState } from './ui-components/toolbar/toolbar.module';
import { getFilenameFromPath } from './utility';
import { MarkdownFilePage } from './views/markdown-file/markdown-file.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent implements AfterViewInit {
  @ViewChild(ToolbarComponent) private _toolbar!: ToolbarComponent;
  private _emptyToolbarState: ToolbarState = {};
  private readonly _log: Logger;

  constructor(private _electronService: ElectronService,
              private _tabManagerService: TabManagerService,
              private _settingsService: SettingsService,
              translateService: TranslateService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment: ' + environment.name);

// TODO: get this from user config eventually
    translateService.setDefaultLang('en');

    _electronService.on(Channel.MenuCommand, (...args) => this.handleMenuCommand(...args));
    _tabManagerService.stateChanges$.subscribe(state => this.onStateChanges(state));
  }

  private onStateChanges(state: StateChange): void {
    switch (state.type) {
      case StateChangeType.Toolbar:
        this._toolbar.state = state.state as ToolbarState;
        break;

      case StateChangeType.Menu:
        this._electronService.emitRendererEvent(RendererEvent.StateChanged, state.state);
        break;

      case StateChangeType.Empty:
        this._toolbar.state = this._emptyToolbarState;
        this._electronService.emitRendererEvent(RendererEvent.StateChanged);
        break;

      default:
        this._log.error(`Unrecognized StateChangeType enum - ${state.type}`);
        break;
    }
  }

  public async ngAfterViewInit(): Promise<void> {
    await this._settingsService.initialize();

    const stylesheets: string[] = this._settingsService.availableStylesheets;
    const options: ToolbarDropdownOption[] = [];

    stylesheets.forEach(stylesheet => options.push({ id: stylesheet,
                                                     text: getFilenameFromPath(stylesheet) ?? ''
                                                  })
                        );
    this.initializeToolbarControls(options);
  }

  private initializeToolbarControls(options: ToolbarDropdownOption[]): void {
    const toolbarControls: ToolbarControls = [
// TODO: remove (or make it a conditional compilation thing???)
      {
        id: ToolbarControlId.OpenDummy,
        type: ToolbarControlType.Button,
        tooltip: 'Open dummy markdown for testing',
        icon: 'assets/icons/close.svg'
      },
// END-TODO
      {
        id: ToolbarControlId.Stylesheets,
        type: ToolbarControlType.Dropdown,
        tooltip: 'Stylesheets',
        selected: this._settingsService.defaultStylesheet,
        options,
        enabled: false
      }
    ];

    this._toolbar.controls = toolbarControls;

    /* Store the initial state when there are no tabs to make it easy to
      reset to this when all tabs are closed.
    */
    this._emptyToolbarState = this._toolbar.state;
  }

  public onToolbarControlClick(result: ToolbarControlResult): void {
    switch (result.id) {
// TODO: remove (or make it a conditional compilation thing???)
      case ToolbarControlId.OpenDummy: {
        const id: number = Date.now();
        this.openMarkdownFile(`c:\\path\\to\\the\\sample\\${id}.md`, id.toString() + '\n\n' + SAMPLE_MARKDOWN);
        break;
      }
// END-TODO
      case ToolbarControlId.Stylesheets:
        this._tabManagerService.sendCommand(MenuCommand.SetStylesheet, result.value);
        break;

      default:
        this._log.error(`Unrecognized toolbar control id '${result.id}'`);
        break;
    }
  }

  private handleMenuCommand = (...args: any[]): void => {
    const menuCommand: MenuCommand = args[0];

    switch (menuCommand) {
      case MenuCommand.OpenMarkdown: {
        const [, filepath, contents] = args;
        this.openMarkdownFile(filepath, contents);
        break;
      }
      case MenuCommand.SaveAsPdf:
        this._tabManagerService.sendCommand(menuCommand, ...args);
        break;

      default:
        this._log.error(`Unsupported MenuCommand - ${menuCommand}`);
        break;
    }
  };

  private openMarkdownFile(filepath: string, contents: string): void {
    const data: MarkdownFile = {
      filepath,
      contents
    };
    this._tabManagerService.open(MarkdownFilePage, data);
  }
}
