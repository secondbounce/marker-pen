import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SAMPLE_MARKDOWN } from '~shared/sample-constants';
import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { Logger, MarkdownFile, Stylesheet } from './core/model';
import { Channel, MenuCommand, MessageType, RendererRequest } from './enums';
import { ElectronService, LogService, MessageService, TabManagerService } from './services';
import { ToolbarComponent, ToolbarControlResult, ToolbarControlType } from './ui-components/toolbar/toolbar.module';
import { getFilenameFromPath } from './utility';
import { MarkdownFilePage } from './views/markdown-file/markdown-file.module';

const enum ToolbarControlId {
  OpenDummy = 'open-dummy',
  Stylesheets = 'stylesheets'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent implements AfterViewInit {
  @ViewChild(ToolbarComponent) private _toolbar!: ToolbarComponent;
  private _currentStylesheet: string = '';
  private readonly _log: Logger;

  constructor(private _electronService: ElectronService,
              private _tabManagerService: TabManagerService,
              messageService: MessageService,
              translateService: TranslateService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment: ' + environment.name);

// TODO: get this from user config eventually
    translateService.setDefaultLang('en');

    _electronService.on(Channel.MenuCommand, (...args) => this.handleMenuCommand(...args));
    messageService.onSend(this.handleSend);
    messageService.onRequest(this.handleRequest);
  }

  public ngAfterViewInit(): void {
    this._electronService.emitRendererRequest(RendererRequest.GetAvailableStylesheets)
                         .then((stylesheets: string[]) => {
                            const options: any[] = [];

                            stylesheets.forEach(stylesheet => options.push({ id: stylesheet,
                                                                             text: getFilenameFromPath(stylesheet)
                                                                           }
                                                ));

// TODO: get 'active' stylesheet from last session if saved somewhere?
                            this._log.assert(stylesheets.length > 0,
                                             'RendererRequest.GetAvailableStylesheets returned no stylesheets');
                            this._currentStylesheet = stylesheets[0];

                            this._toolbar.controls = [
        {
          id: ToolbarControlId.OpenDummy,
          type: ToolbarControlType.Button,
          tooltip: 'Open dummy markdown for testing',
          icon: 'assets/icons/close.svg'
        },
                              {
                                id: ToolbarControlId.Stylesheets,
                                type: ToolbarControlType.Dropdown,
                                tooltip: 'Stylesheets',
                                selected: this._currentStylesheet,
                                options
                              }
                            ];
                          });
  }

  public onToolbarControlClick(result: ToolbarControlResult): void {
    switch (result.id) {
      case ToolbarControlId.OpenDummy:
        this.openMarkdownFile('c:\\path\\to\\the\\sample\\markdown.md', SAMPLE_MARKDOWN);
        break;

      case ToolbarControlId.Stylesheets:
        this._currentStylesheet = result.value as string;
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

  private handleSend = (...args: any[]): void => {
    const message: MessageType = args[0];

    switch (message) {
      case MessageType.SetActiveStylesheet: {
        const [, stylesheet] = args;

        this._toolbar.state = {
          [ToolbarControlId.Stylesheets]: {
            id: ToolbarControlId.Stylesheets,
            value: stylesheet,
            enabled: true
          }
        };
        break;
      }
      default:
        this._log.error(`Unsupported MessageType - ${message}`);
        break;
    }
  };

  private handleRequest = async (...args: any[]): Promise<any> => {
    const message: MessageType = args[0];

    switch (message) {
      case MessageType.GetStylesheet: {
// TODO: look up last stylesheet used for this file (for now, just use current)
        // const [, filePath] = args;
        const stylesheet: Stylesheet = {
          filepath: this._currentStylesheet,
          css: ''
        };
        const css: any = await this._electronService.emitRendererRequest(RendererRequest.GetStylesheet,
                                                                         stylesheet);
        if (typeof (css) === 'string') {
          stylesheet.css = css;
        }

        return stylesheet;
      }
      default: {
        const error: string = `Unsupported MessageType - ${convertToText(args)}`;
        this._log.error(error);
// TODO: need to display the error message somehow
        return Promise.reject(new Error(error));
      }
    }
  };
}
