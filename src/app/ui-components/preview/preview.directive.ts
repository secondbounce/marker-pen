import { Directive, ElementRef, Input } from '@angular/core';

import { Logger } from 'app/logger';
import { LogService } from 'src/app/services';

@Directive({
  selector: 'iframe[appPreview]',
  standalone: true
})
export class PreviewDirective {
  private _iframe: HTMLIFrameElement;
  private _html: string = '';
  private _css: string = '';
  private readonly _log: Logger;

  constructor(private _elementRef: ElementRef,
              logService: LogService) {
    this._log = logService.getLogger('MarkdownFilePage');

    this._iframe = _elementRef.nativeElement;
  }

  /**
   * The HTML document content to be displayed.
   *
   * The content is assumed to be a complete document, including the `HTML` element, that has been
   * sanitized to remove any unsafe elements.
   */
  @Input()
  public get appPreview(): string {
    return this._html;
  }
  public set appPreview(html: string) {
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

  private refreshPreview(): void {
    if (this._html.length > 0 && this._css.length > 0) {

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
      const css: string = '<style>' + this._css + '</style>';
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
