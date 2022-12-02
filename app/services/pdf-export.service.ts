import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';

import { PdfFormat } from '../model';
import { ConfigService } from './config.service';

export class PdfExportService {
  private static _instance: PdfExportService;
  private _configService: ConfigService = ConfigService.instance;
  private _browserPromise: Promise<Browser> | undefined;

  public static get instance(): PdfExportService {
    return this._instance || (this._instance = new this());
  }

  /** Ensures that any Puppeteer resources are released */
  public close(): void {
    if (this._browserPromise) {
      this._browserPromise.then(browser => {
                            browser.close();
                            this._browserPromise = undefined;
                          });
    }
  }

  public async export(filepath: string, html: string): Promise<void> {
    const browser: Browser = await this.getBrowser();
    const page: Page = await browser.newPage();

    const pdfOptions: PDFOptions = this.getPdfOptions();
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
    const config: PdfFormat = this._configService.getPdfFormat();

    return {
      // scale?: number;
      displayHeaderFooter: typeof(config.headerTemplate) !== 'undefined'
                        || typeof(config.footerTemplate) !== 'undefined',
      headerTemplate: config.headerTemplate,
      footerTemplate: config.footerTemplate,
      printBackground: true,
      landscape: config.landscape,
      // pageRanges?: string;
      format: config.paperFormat,
      // width?: string | number;
      // height?: string | number;
      // preferCSSPageSize?: boolean;
      margin: {
        top: config.margins.top,
        bottom: config.margins.bottom,
        left: config.margins.left,
        right: config.margins.right
      }
      // path?: string;
      // omitBackground?: boolean;
      // timeout?: number;
    };
  }
}
