import { AfterContentChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { Logger } from 'src/app/core/model';
import { LogService } from 'src/app/services';

const SCREEN_CSS: string = `
@media screen {
  body {
    margin: 1em;
  }
}
`;

@Component({
  selector: 'app-preview',
  template: '<iframe #iframe></iframe>',
  styleUrls: ['./preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    LogService
  ]
})
export class PreviewComponent implements AfterContentChecked, AfterViewInit {
  @ViewChild('iframe') private _elementRef?: ElementRef;
  private _iframe?: HTMLIFrameElement;
  private _html: string = '';
  private _css: string = '';
  private readonly _log: Logger;

  constructor(logService: LogService) {
    this._log = logService.getLogger('PreviewComponent');
  }

  /* IFRAMEs don't appear to retain their content if the parent view container is detached/reattached
    so we need to hook into this event to refresh the content (AfterContentChecked and
    AfterViewChecked are the only events raised when it's reattached).
  */
  public ngAfterContentChecked(): void {
    this.refreshPreview();
  }

  public ngAfterViewInit(): void {
    if (this._elementRef) {
      this._iframe = this._elementRef.nativeElement;
    }
  }

  /**
   * The HTML document content to be displayed.
   *
   * The content is assumed to be a complete document, including the `HTML` element, that has been
   * sanitized to remove any unsafe elements.
   */
  @Input()
  public get html(): string {
    return this._html;
  }
  public set html(html: string) {
    this._html = html;
    this.refreshPreview();
  }

  @Input()
  public get css(): string {
    return this._css;
  }
  public set css(css: string) {
    this._css = css;
    this.refreshPreview();
  }

  public getHtmlContent(): string | undefined {
    let contents: string | undefined;

    if (this._iframe) {
      /* Binding in the template to the IFRAME's `srcdoc` property doesn't work as the HEAD element
        is ignored (see https://stackoverflow.com/q/38457662/4591974), so we have to adopt this
        approach.
      */
      const doc: Document | undefined = this._iframe.contentDocument || this._iframe.contentWindow?.document;
      if (doc) {
        contents = doc.documentElement.outerHTML;
      } else {
        this._log.error('No document available from IFRAME');
      }
    }

    return contents;
  }

  private refreshPreview(): void {
    if (this._iframe && this._html.length > 0 && this._css.length > 0) {
      /* Binding in the template to the IFRAME's `srcdoc` property doesn't work as the HEAD element
        is ignored (see https://stackoverflow.com/q/38457662/4591974), so we have to adopt this
        approach.
      */
      const doc: Document | undefined = this._iframe.contentDocument || this._iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(this._html);
        this.appendStyleElements(doc);
        doc.close();
      } else {
        this._log.error('No document available from IFRAME');
      }
    }
  }

  private appendStyleElements(doc: Document): void {
    const head: HTMLHeadElement | null = doc.getElementsByTagName('head')
                                            .item(0);

    if (head !== null) {
      const css: string = '<style>'
                        + this._css
                        + SCREEN_CSS
                        + '</style>';
      const cssFragment: DocumentFragment = document.createRange()
                                                    .createContextualFragment(css);

      /* An explicit check for HTMLStyleElements will avoid any attempts to inject extra 'unwanted'
        content into the DOM.
      */
      cssFragment.childNodes.forEach(childNode => {
        if (childNode instanceof HTMLStyleElement) {
          head.appendChild(childNode);
        }
      });
    } else {
      this._log.error('No HEAD element available in document');
    }
  }
}
