import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { SAMPLE_MARKDOWN } from './constants';
import { Logger, MarkdownFile } from './core/model';
import { Channel, MenuCommand } from './enums';
import { ElectronService, LogService, TabManagerService } from './services';
import { MarkdownFilePage } from './views/markdown-file/markdown-file.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent {
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

// TODO: temporary only for testing in browsers
  public openTestContent(): void {
   this.handleMenuCommand(MenuCommand.OpenMarkdown,
                          'c:\\path\\to\\the\\sample\\markdown.md',
                          SAMPLE_MARKDOWN);
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
