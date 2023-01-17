/* eslint-disable import/namespace -- TODO: not sure why this is being triggered but can be ignored
                                            perhaps see https://github.com/cure53/DOMPurify/issues/705
*/
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as DOMPurify from 'dompurify';
import hljs, { HighlightResult } from 'highlight.js';
import { marked } from 'marked';

import { stringify } from '~shared/index';
import { LogService } from './log.service';
import { TAB_WIDTH_IN_SPACES } from '../constants';
import { Logger } from '../core/model';

// TODO: support MD flavours:
//  * markdown.pl
//  * GitHub flavored markdown

@Injectable({
  providedIn: 'root'
})
export class ConverterService {
  private _defaultOptions: marked.MarkedOptions;
  private readonly _log: Logger;

  constructor(private _sanitizer: DomSanitizer,
              logService: LogService) {
    this._log = logService.getLogger('ConverterService');

    this._defaultOptions = {
      // async: false,
      // baseUrl: undefined,
      // breaks: false,
      // extensions: undefined,
      // gfm: true,
      // headerIds: true,
      // headerPrefix: '',
      highlight: this.highlightCode,
      // langPrefix: 'language-',
      // mangle: true,
      // pedantic: false,
      // renderer: new Renderer(),
      sanitizer: this.sanitizeHtml,
      // silent: false,
      smartLists: true
      // smartypants: false,
      // tokenizer: new Tokenizer(),
      // walkTokens: undefined,
      // xhtml: false
    };

    this.setDefaultSanitizerConfig();
  }

  private setDefaultSanitizerConfig(): void {
    const config: DOMPurify.Config = this.getDefaultConfig();
    DOMPurify.setConfig(config);
  }

  private getDefaultConfig(): DOMPurify.Config {
    const config: DOMPurify.Config = {
      // ADD_ATTR?: string[] | undefined;
      // ADD_DATA_URI_TAGS?: string[] | undefined;
      // ADD_TAGS?: string[] | undefined;
      // ADD_URI_SAFE_ATTR?: string[] | undefined;
      // ALLOW_ARIA_ATTR?: boolean | undefined;
      // ALLOW_DATA_ATTR?: boolean | undefined;
      // ALLOW_UNKNOWN_PROTOCOLS?: boolean | undefined;
      // ALLOWED_ATTR?: string[] | undefined;
      // ALLOWED_TAGS?: string[] | undefined;
      // ALLOWED_NAMESPACES?: string[] | undefined;
      // ALLOWED_URI_REGEXP?: RegExp | undefined;
      // FORBID_ATTR?: string[] | undefined;
      // FORBID_CONTENTS?: string[] | undefined;
      // FORBID_TAGS?: string[] | undefined;
      // FORCE_BODY?: boolean | undefined;
      // IN_PLACE?: boolean | undefined;
      // KEEP_CONTENT?: boolean | undefined;
      // NAMESPACE?: string | undefined;
      // PARSER_MEDIA_TYPE?: string | undefined;
      // RETURN_DOM_FRAGMENT?: boolean | undefined;
      // /**
      //  * This defaults to `true` starting DOMPurify 2.2.0. Note that setting it to `false`
      //  * might cause XSS from attacks hidden in closed shadowroots in case the browser
      //  * supports Declarative Shadow: DOM https://web.dev/declarative-shadow-dom/
      //  */
      // RETURN_DOM_IMPORT?: boolean | undefined;
      // RETURN_DOM?: boolean | undefined;
      // RETURN_DOM: true,
      // RETURN_TRUSTED_TYPE?: boolean | undefined;
      // SAFE_FOR_TEMPLATES?: boolean | undefined;
      // SANITIZE_DOM?: boolean | undefined;
      // /** @default false */
      // SANITIZE_NAMED_PROPS?: boolean | undefined;
      USE_PROFILES: {
        html: true
      },
      WHOLE_DOCUMENT: true
      // CUSTOM_ELEMENT_HANDLING?: {
      //     tagNameCheck?: RegExp | ((tagName: string) => boolean) | null | undefined;
      //     attributeNameCheck?: RegExp | ((lcName: string) => boolean) | null | undefined;
      //     allowCustomizedBuiltInElements?: boolean | undefined;
      // };
    };

    return config;
  }

  public plaintextToSafeHtml(plaintext: string, preserveIndents: boolean = false): SafeHtml {
    const cleanHtml: string = this.plaintextToHtml(plaintext, preserveIndents);

    return this._sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  /**
   * Converts plaintext to HTML, encoding 'unsafe' and new line characters as HTML entities,
   * optionally preserving indentation indicated with tab characters or multiple leading
   * spaces.
   */
  public plaintextToHtml(plaintext: string, preserveIndents: boolean = false): string {
    let escaped: string = this.htmlEncodePlaintext(plaintext)
                              .replace(/\r\n?|\n/g, '<br>');

    if (preserveIndents) {
      escaped = escaped.replace('\t', '&nbsp;'.repeat(TAB_WIDTH_IN_SPACES));

      const matches: RegExpMatchArray | null = escaped.match(/ {2,}/g);
      if (matches) {
        for (const match of matches) {
          escaped = escaped.replace(match, '&nbsp;'.repeat(match.length - 1) + ' ');
        }
      }
    }

    return this.sanitizeHtml(escaped);
  }

  public htmlEncodePlaintext(plaintext: string): string {
    /* Escaping according to OWASP recommendations:
        https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-1---html-escape-before-inserting-untrusted-data-into-html-element-content

      As noted in that cheatsheet, '&apos;' not recommended because it's not in the HTML spec (See section
      24.4.1) - it's in the XML and XHTML specs.  Also, forward slash is included as it helps end an HTML entity.
    */
    return plaintext.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/\//g, '&#x2F;');
  }

  public markdownToHtml(markdown: string): string {
    const html: string = marked.parse(markdown, this._defaultOptions);
    return this.sanitizeHtml(html);
  }

  public markdownToSafeHtml(markdown: string): SafeHtml {
    const html: string = this.markdownToHtml(markdown);
    const cleanHtml: string = this.sanitizeHtml(html);

    return this._sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  private sanitizeHtml = (html: string): string => {
    const cleanHtml: string = DOMPurify.sanitize(html);

    if (DOMPurify.removed && DOMPurify.removed.length > 0) {
      let removedContent: string = '';

      DOMPurify.removed.forEach((item: any) => {
        if (item.element) {
          removedContent += '\r\n\tElement: ' + item.element.outerHTML;
        } else if (item.attribute) {
          removedContent += `\r\n\tAttribute: ${item.from.tagName}.${item.attribute.name}="${item.attribute.value}"`;
        } else {
          removedContent += '\r\n\t' + stringify(item);
        }
      });

      this._log.warn(`Insecure HTML content found in Markdown has been removed:${removedContent}`);
    }

    return cleanHtml;
  };

  private highlightCode = (code: string, lang: string): string => {
    let html: string;

    /* Using 'auto' mode with highlight.js is a bit hit-and-miss - non-obvious code can often end
      up being assigned a fairly esoteric language that just looks odd.  So we're only going to use
      highlight.js if a language has been explicitly assigned.
    */
    if (lang.length > 0) {
      const result: HighlightResult = hljs.highlight(code, {language: lang});
      html = result.value;
    } else {
      html = this.plaintextToHtml(code, true);
    }

    return html;
  };
}
