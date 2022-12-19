import { PdfFormat } from './pdf-format';

export interface Settings {
  stylesheets: string[];
  defaultStylesheet: string;
  pdfFormat: PdfFormat;
}
