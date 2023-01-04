import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';

import { PdfFormat } from '../shared/pdf-format';
import { SettingsService } from './settings.service';

export class PdfExportService {
  private static _instance: PdfExportService;
  private _settingsService: SettingsService = SettingsService.instance;
  private _browserPromise: Promise<Browser> | undefined;

  public static get instance(): PdfExportService {
    return this._instance || (this._instance = new this());
  }

  /** Ensures that any Puppeteer resources are released */
  public close(): void {
    if (typeof(this._browserPromise) !== 'undefined') {
      this._browserPromise.then(browser => {
                            browser.close();
                            this._browserPromise = undefined;
                          });
    }
  }

  public async export(filepath: string, html: string, header: string, footer: string): Promise<void> {
    const browser: Browser = await this.getBrowser();
    const page: Page = await browser.newPage();

    const pdfOptions: PDFOptions = this.getPdfOptions();
    pdfOptions.headerTemplate = header;
    pdfOptions.footerTemplate = footer;
    pdfOptions.path = filepath;

    await page.setContent(html, { waitUntil: 'networkidle2' });
    await page.pdf(pdfOptions);
    await page.close();
  }

  private getBrowser(): Promise<Browser> {
    if (typeof(this._browserPromise) === 'undefined') {
      this._browserPromise = puppeteer.launch(/*{ devtools: config.devtools, ...config.launch_options }*/);
    }

    return this._browserPromise;
  }

  private getPdfOptions(): PDFOptions {
    const pdfFormat: PdfFormat = this._settingsService.getPdfFormat();

    return {
      // scale?: number;
      displayHeaderFooter: typeof(pdfFormat.headerTemplate) !== 'undefined'
                        || typeof(pdfFormat.footerTemplate) !== 'undefined',
      headerTemplate: pdfFormat.headerTemplate,
      footerTemplate: pdfFormat.footerTemplate,
      printBackground: true,
      landscape: pdfFormat.landscape,
      // pageRanges?: string;
      format: pdfFormat.paperFormat,
      // width?: string | number;
      // height?: string | number;
      // preferCSSPageSize?: boolean;
      margin: {
        top: pdfFormat.margins.top,
        bottom: pdfFormat.margins.bottom,
        left: pdfFormat.margins.left,
        right: pdfFormat.margins.right
      }
      // path?: string;
      // omitBackground?: boolean;
      // timeout?: number;
    };
  }
}
