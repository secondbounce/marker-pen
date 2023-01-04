import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { MenuCommand, MenuId, MenuItemState, PdfFormat, RendererEvent } from '~shared/index';
import { Logger, MarkdownFile } from 'src/app/core/model';
import { StateChangeType, ToolbarControlId } from 'src/app/enums';
import { ConverterService, ElectronService, LogService, SettingsService, StylesheetService } from 'src/app/services';
import { TabPanelComponent } from 'src/app/tabs';
import { PreviewComponent } from 'src/app/ui-components/preview/preview.component';
import { ToolbarState } from 'src/app/ui-components/toolbar/toolbar.module';
import { getFilenameFromPath } from 'src/app/utility';

const HEADER_REGEXP: RegExp = /^(?:.*\s*,\s*)?\bheader\b(?:\s*,\s*.*)?$/im;
const FOOTER_REGEXP: RegExp = /^(?:.*\s*,\s*)?\bfooter\b(?:\s*,\s*.*)?$/im;
const RULE_REXEXP: RegExp = /(?:.*{\s*)(.*)(?:\s*})/im;

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
              private _settingsService: SettingsService,
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
    const doc: Document | undefined = this._preview.getDocument();

    if (doc) {
      const contents: string = doc.documentElement.outerHTML;
      let header: string = '';
      let footer: string = '';
      const pdfFormat: PdfFormat = this._settingsService.pdfFormat;

      if (pdfFormat.displayHeader && pdfFormat.headerTemplate) {
        header = this.getTemplate(doc, pdfFormat.headerTemplate, true);
      }
      if (pdfFormat.displayFooter && pdfFormat.footerTemplate) {
        footer = this.getTemplate(doc, pdfFormat.footerTemplate, false);
      }

      this._electronService.emitRendererEvent(RendererEvent.SaveAsPdf, this._filePath, contents, header, footer);
    } else {
      this._log.error('No document available from preview');
    }
  }

  private getTemplate(doc: Document, template: string, header: boolean): string {
    const cssStyles: string = this.getCssStyles(doc.styleSheets, header);

    if (cssStyles.length > 0) {
      const fragment: DocumentFragment = document.createRange()
                                                 .createContextualFragment(template);
      const element: Element | null = fragment.firstElementChild;

      if (element !== null) {
        const styles: string = element.getAttribute('style') ?? '';

        /* Add the stylesheet styles before those in the template since that's the expected order
          of precedence.
        */
        element.setAttribute('style', cssStyles + styles);
        template = element.outerHTML;
      }
    }

    return template;
  }

  private getCssStyles(styleSheets: StyleSheetList, header: boolean): string {
    let styles: string = '';
    styles = '';

    /* eslint-disable @typescript-eslint/prefer-for-of -- StyleSheetList and CSSRuleList don't have
      a '[Symbol.iterator]()' method
    */
    for (let i: number = 0; i < styleSheets.length; i++) {
      const cssRules: CSSRuleList = styleSheets[i].cssRules;

      for (let j: number = 0; j < cssRules.length; j++) {
        const rule: CSSStyleRule = cssRules[j] as CSSStyleRule;
        const regexp: RegExp = header ? HEADER_REGEXP : FOOTER_REGEXP;

        if (regexp.exec(rule.selectorText) !== null) {
          const matches: RegExpExecArray | null = RULE_REXEXP.exec(rule.cssText);
          if (matches !== null) {
            styles += this.prepareCssText(matches[1]);
          } else {
            this._log.error(`CSS rule text is in an unexpected format - '${rule.cssText}'`);
          }
        }
      }
    }
    /* eslint-enable @typescript-eslint/prefer-for-of */

    return styles;
  }

  private prepareCssText(cssText: string): string {
    cssText = cssText.trim();

    return cssText + (cssText.endsWith(';') ? ' ' : '; ');
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
