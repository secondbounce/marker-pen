import { RecentItem } from 'app/model';

const enum ConfigKey {
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
  }
};

/* eslint-disable-next-line @typescript-eslint/typedef, @typescript-eslint/no-var-requires -- this
  library uses `#private` variables that are incompatible with the current target.  So for now, we
  have to `require` the library, rather than `import` it.
*/
const Store = require('electron-store');

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
}
