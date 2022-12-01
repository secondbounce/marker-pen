import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SAMPLE_MARKDOWN } from '~shared/sample-constants';
import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { Logger, MarkdownFile } from './core/model';
import { Channel, MenuCommand, MessageType } from './enums';
import { ElectronService, LogService, MessageService, StylesheetService, TabManagerService } from './services';
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
  private readonly _log: Logger;

  constructor(private _electronService: ElectronService,
              private _tabManagerService: TabManagerService,
              private _stylesheetService: StylesheetService,
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
    this._stylesheetService.getAvailableStylesheets()
                           .then((stylesheets: string[]) => {
                              const options: any[] = [];

                              stylesheets.forEach(stylesheet => options.push({ id: stylesheet,
                                                                              text: getFilenameFromPath(stylesheet)
                                                                            }
                                                  ));

                              this._toolbar.controls = [
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
                                  selected: this._stylesheetService.activeStylesheet,
                                  options
                                }
                              ];
                            });
  }

  public onToolbarControlClick(result: ToolbarControlResult): void {
    switch (result.id) {
      case ToolbarControlId.OpenDummy: {
        const id: number = Date.now();
        this.openMarkdownFile(`c:\\path\\to\\the\\sample\\${id}.md`, id.toString() + '\n\n' + SAMPLE_MARKDOWN);
        break;
      }
      case ToolbarControlId.Stylesheets:
        this._stylesheetService.activeStylesheet = result.value as string;
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

        this.handleSetActiveStylesheet(stylesheet);
        break;
      }
      default:
        this._log.error(`Unsupported MessageType - ${message}`);
        break;
    }
  };

  private handleSetActiveStylesheet(stylesheet: string): void {
    const currentStylesheet: string = this._toolbar.state[ToolbarControlId.Stylesheets].value as string;

    if (stylesheet !== currentStylesheet) {
      this._toolbar.state = {
        [ToolbarControlId.Stylesheets]: {
          id: ToolbarControlId.Stylesheets,
          value: stylesheet,
          enabled: true
        }
      };
    }
  }

// TODO: currently unused
  private handleRequest = async (...args: any[]): Promise<any> => {
    const message: MessageType = args[0];

    switch (message) {
      default: {
        const error: string = `Unsupported MessageType - ${convertToText(args)}`;
        this._log.error(error);
// TODO: need to display the error message somehow
        return Promise.reject(new Error(error));
      }
    }
  };
}
