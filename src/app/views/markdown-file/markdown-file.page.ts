import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { MenuCommand, MenuId, MenuItemState, RendererEvent } from '~shared/index';
import { Logger, MarkdownFile } from 'src/app/core/model';
import { StateChangeType, ToolbarControlId } from 'src/app/enums';
import { ConverterService, ElectronService, LogService, StylesheetService } from 'src/app/services';
import { TabPanelComponent } from 'src/app/tabs';
import { PreviewComponent } from 'src/app/ui-components/preview/preview.component';
import { ToolbarState } from 'src/app/ui-components/toolbar/toolbar.module';
import { getFilenameFromPath } from 'src/app/utility';

@Component({
  selector: 'app-markdown-file',
  templateUrl: './markdown-file.page.html',
  styleUrls: ['./markdown-file.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MarkdownFilePage extends TabPanelComponent<MarkdownFile> {
  public markdown: SafeHtml = '';
  public html: string = '';
  public css: string = '';
  @ViewChild(PreviewComponent) private _preview!: PreviewComponent;
  private _filePath: string | undefined;
  private _stylesheet: string | undefined;
  private readonly _log: Logger;

  constructor(private _converterService: ConverterService,
              private _stylesheetService: StylesheetService,
              private _electronService: ElectronService,
              logService: LogService) {
    super();

    this._log = logService.getLogger('MarkdownFilePage');
  }

  public setData(data: MarkdownFile): void {
    super.setData(data);

    this._filePath = data.filepath;
    this.markdown = this._converterService.plaintextToSafeHtml(data.contents, true);
    this.html = this._converterService.markdownToHtml(data.contents);

// TODO: suffix with index of new files
// TODO: make sure this works for new files (what will be passed as the filepath?)
    const title: string = getFilenameFromPath(this._filePath, true) ?? 'Untitled';
    const fullTitle: string = this._filePath.length > 0 ? this._filePath : 'Untitled';

    this.setTitle(title, fullTitle);
  }

  public setActive(active: boolean): void {
    super.setActive(active);

    this._log.debug(`Setting tab ${this.title} as ${active ? 'ACTIVE' : 'INACTIVE'}`);

    if (active) {
      if (typeof(this._stylesheet) === 'undefined') {
        /* We need to know what stylesheet/CSS to use, which will be whatever the toolbar is set to */
        this._stylesheetService.getLastUsedStylesheet(this._filePath)
                               .then(data => {
                                  this._stylesheet = data.filepath;
                                  this.css = data.css;
                                  this._log.debug(`Last used stylesheet for ${this._filePath}: ${this._stylesheet}`);
                                  this.sendToolbarStateChange();
                                });
      }

      /* The stylesheet had been set previously, i.e. the tab has been reactivated, we need to
        make sure the toolbar is updated to show it (since the previously active file may have
        used a different one).  If not, it'll be undefined, so the toolbar will not be changed.
      */
      this.sendToolbarStateChange();

      const menuItemState: MenuItemState[] = [
        {
          id: MenuId.SaveAsPdf,
          enabled: true
        }
      ];
      this._stateChanges$.next({
        type: StateChangeType.Menu,
        state: menuItemState
      });
    }
  }

  private sendToolbarStateChange(): void {
    const toolbarState: ToolbarState = {
      [ToolbarControlId.Stylesheets]: {
        id: ToolbarControlId.Stylesheets,
        enabled: true,
        value: this._stylesheet
      }
    };
    this._stateChanges$.next({
      type: StateChangeType.Toolbar,
      state: toolbarState
    });
  }

  public onCommand(menuCommand: MenuCommand, ...args: any[]): void {
    switch (menuCommand) {
      case MenuCommand.SaveAsPdf:
        this.saveAsPdf();
        break;

      case MenuCommand.SetStylesheet: {
        const [stylesheet] = args;
        this.setStylesheet(stylesheet);
        break;
      }
      default:
        this._log.error(`Unsupported MenuCommand - ${menuCommand}`);
        break;
    }
  }

  private saveAsPdf(): void {
    const contents: string | undefined = this._preview.getHtmlContent();

    if (contents) {
      this._electronService.emitRendererEvent(RendererEvent.SaveAsPdf, this._filePath, contents);
    }
  }

  private setStylesheet(stylesheet: string): void {
    if (this._active && stylesheet !== this._stylesheet) {
      this._stylesheetService.getStylesheet(stylesheet)
                             .then(data => {
                                this._stylesheet = data.filepath;
                                this.css = data.css;
                                this._log.debug(`Changing stylesheet for ${this._filePath}: ${this._stylesheet}`);
                              });
    }
  }
}
