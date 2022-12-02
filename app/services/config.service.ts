import { PdfFormat, RecentItem } from 'app/model';

const enum ConfigKey {
  // eslint-disable-next-line @typescript-eslint/no-shadow -- we know what we're doing here ;-)
  PdfFormat = 'pdf-format',
  RecentlyOpened = 'recentlyOpened',
  Stylesheets = 'stylesheets'
}
const schema: Record<string, unknown> = {
  [ConfigKey.RecentlyOpened]: {
    type: 'array',
    items: {
      type: 'object'
    }
  },
  [ConfigKey.Stylesheets]: {
    type: 'array',
    items: {
      type: 'string'
    }
  },
  [ConfigKey.PdfFormat]: {
    type: 'object'
  }
};

/* eslint-disable-next-line @typescript-eslint/typedef, @typescript-eslint/no-var-requires -- this
  library uses `#private` variables that are incompatible with the current target.  So for now, we
  have to `require` the library, rather than `import` it.
*/
const Store = require('electron-store');
const DEFAULT_PDF_FORMAT: PdfFormat = {
  paperFormat: 'a4',
  landscape: false,
  margins: {
    top: '20mm',
    bottom: '20mm',
    left: '20mm',
    right: '20mm'
  },
  displayHeader: false,
  displayFooter: false
};

export class ConfigService {
  private static _instance: ConfigService;
  private _store;

  constructor() {
    this._store = new Store({ schema });
  }

  public static get instance(): ConfigService {
    return this._instance || (this._instance = new this());
  }

  public getRecentItems(): RecentItem[] {
    return this._store.get(ConfigKey.RecentlyOpened, []) as RecentItem[];
  }
  public setRecentItems(recentItems: RecentItem[]): void {
    this._store.set(ConfigKey.RecentlyOpened, recentItems);
  }

  public getStylesheets(): string[] {
    return this._store.get(ConfigKey.Stylesheets, []) as string[];
  }
  public setStylesheets(stylesheets: string[]): void {
    this._store.set(ConfigKey.Stylesheets, stylesheets);
  }

  public getPdfFormat(): PdfFormat {
    return this._store.get(ConfigKey.PdfFormat, DEFAULT_PDF_FORMAT) as PdfFormat;
  }
  public setPdfFormat(pdfFormat: PdfFormat): void {
    this._store.set(ConfigKey.PdfFormat, pdfFormat);
  }
}
