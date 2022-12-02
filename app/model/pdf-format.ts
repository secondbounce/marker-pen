/* Note - currently matching the values accepted by Puppeteer */
export declare type PaperFormat = 'letter' | 'legal' | 'tabloid' | 'ledger' | 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6';

export interface PdfFormat {
  paperFormat: PaperFormat;
  landscape: boolean;
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  }
  displayHeader: boolean;
  headerTemplate?: string;
  displayFooter: boolean;
  footerTemplate?: string;
}
