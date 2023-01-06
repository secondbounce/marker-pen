import { Logger } from '../logger';
import { RecentItem } from '../model';
import { DEFAULT_STYLESHEET, PdfFormat, SettingKey } from '../shared';

/* eslint-disable-next-line @typescript-eslint/typedef, @typescript-eslint/no-var-requires -- this
  library uses `#private` variables that are incompatible with the current target.  So for now, we
  have to `require` the library, rather than `import` it.
*/
const Store = require('electron-store');

const schema: Record<string, unknown> = {
  [SettingKey.RecentlyOpened]: {
    type: 'array',
    items: {
      type: 'object'
    }
  },
  [SettingKey.Stylesheets]: {
    type: 'array',
    items: {
      type: 'string'
    }
  },
  [SettingKey.DefaultStylesheet]: {
    type: 'string'
  },
  [SettingKey.PdfFormat]: {
    type: 'object'
  }
};
const DEFAULT_PDF_FORMAT: PdfFormat = {
  paperFormat: 'a4',
  landscape: false,
  margins: {
    top: '15mm',
    bottom: '15mm',
    left: '20mm',
    right: '20mm'
  },
  displayHeader: true,
  headerTemplate: '<header class="title"></header>',
  displayFooter: true,
  footerTemplate: '<footer><span class="pageNumber"></span>/<span class="totalPages"></span></footer>'
};

export class SettingsService {
  private static _instance: SettingsService;
  private _store;
  private readonly _log: Logger;

  constructor() {
    this._log = new Logger('SettingsService');
    this._store = new Store({ schema });
  }

  public static get instance(): SettingsService {
    return this._instance || (this._instance = new this());
  }

  public handleSettingsRequest = (...args: any[]): Promise<any> => {
    const settingKey: SettingKey = args[0];
    let result: any;

    switch (settingKey) {
      case SettingKey.All:
        result = {
          stylesheets: this.getStylesheets(),
          defaultStylesheet: this.getDefaultStylesheet(),
          pdfFormat: this.getPdfFormat()
        };
        break;

      default: {
        const message: string = `Unsupported SettingKey - ${settingKey}`;
        this._log.error(message);
// TODO: need to display the error message somehow
        return Promise.reject(new Error(message));
      }
    }

    return Promise.resolve(result);
  };

  public handleSettingsEvent = (...args: any[]): void => {
    const settingKey: SettingKey = args[0];

    switch (settingKey) {
      case SettingKey.All: {
        const [, settings] = args;
        this.setStylesheets(settings.stylesheets);
        this.setDefaultStylesheet(settings.defaultStylesheet);
        this.setPdfFormat(settings.pdfFormat);
        break;
      }
      default: {
        const message: string = `Unsupported SettingKey - ${settingKey}`;
        this._log.error(message);
// TODO: need to display the error message somehow
      }
    }
  };

  private getDefaultStylesheet(): string {
    return this._store.get(SettingKey.DefaultStylesheet, DEFAULT_STYLESHEET) as string;
  }
  public setDefaultStylesheet(stylesheet: string): void {
    this._store.set(SettingKey.DefaultStylesheet, stylesheet);
  }

  public getRecentItems(): RecentItem[] {
    return this._store.get(SettingKey.RecentlyOpened, []) as RecentItem[];
  }
  public setRecentItems(recentItems: RecentItem[]): void {
    this._store.set(SettingKey.RecentlyOpened, recentItems);
  }

  public getPdfFormat(): PdfFormat {
    return this._store.get(SettingKey.PdfFormat, DEFAULT_PDF_FORMAT) as PdfFormat;
  }
  public setPdfFormat(pdfFormat: PdfFormat): void {
    this._store.set(SettingKey.PdfFormat, pdfFormat);
  }

  private getStylesheets(): string[] {
    return this._store.get(SettingKey.Stylesheets, [DEFAULT_STYLESHEET]) as string[];
  }
  public setStylesheets(stylesheets: string[]): void {
    this._store.set(SettingKey.Stylesheets, stylesheets);
  }
}
