import { AfterViewInit, ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { Logger, MarkdownFile } from './core/model';
import { Channel, MenuCommand } from './enums';
import { SAMPLE_MARKDOWN } from './sample-constants';
import { ElectronService, LogService, TabManagerService } from './services';
import { ToolbarComponent, ToolbarControlResult, ToolbarControlType } from './ui-components/toolbar/toolbar.module';
import { MarkdownFilePage } from './views/markdown-file/markdown-file.module';

const enum ToolbarControlId {
  OpenDummy = 'open-dummy',
  SelectCss = 'select-css',
  Check = 'check'
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
              translateService: TranslateService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment: ' + environment.name);

// TODO: get this from user config eventually
    translateService.setDefaultLang('en');

    _electronService.on(Channel.MenuCommand, (...args) => this.handleMenuCommand(...args));
  }

  public ngAfterViewInit(): void {
    /* Use timeout to avoid ExpressionChangedAfterItHasBeenCheckedError */
    setTimeout(() => {
      this._toolbar.controls = [
        {
          id: ToolbarControlId.OpenDummy,
          type: ToolbarControlType.Button,
          tooltip: 'Open dummy markdown for testing',
          icon: 'assets/icons/close.svg'
        },
        {
          id: ToolbarControlId.SelectCss,
          type: ToolbarControlType.Dropdown,
          tooltip: 'Select',
          selected: '',
          options: [
            { id: 'aa', text: 'Alice' },
            { id: 'bb', text: 'Bob' },
            { id: 'cc', text: 'Chris' }
          ]
        },
        {
          id: ToolbarControlId.Check,
          type: ToolbarControlType.Checkbox,
          tooltip: 'check box',
          checked: true,
          icon: 'assets/icons/close.svg'
        }
      ];
    });
  }

  public onToolbarControlClick(result: ToolbarControlResult): void {
    console.log('click:', result);
    switch (result.id) {
      case ToolbarControlId.OpenDummy:
        this.openMarkdownFile('c:\\path\\to\\the\\sample\\markdown.md', SAMPLE_MARKDOWN);
        break;

      case ToolbarControlId.SelectCss:
        break;

      case ToolbarControlId.Check:
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
        this._log.error(`Unsupported MenuCommand - ${convertToText(menuCommand)}`);
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
