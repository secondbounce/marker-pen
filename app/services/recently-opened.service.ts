import { ReplaySubject } from 'rxjs';

import { RecentItem } from '../../src/app/core/model';

/* eslint-disable-next-line @typescript-eslint/typedef, @typescript-eslint/no-var-requires -- this
  library uses `#private` variables that are incompatible with the current target.  So for now, we
  have to `require` the library, rather than `import` it.
*/
const Store = require('electron-store');

const RECENTLY_OPENED_KEY: string = 'recentlyOpened';
const MAX_RECENTLY_OPENED_ITEMS: number = 10;

/* In a 'normal' Angular app, services are singletons instantiated and managed by the
  framework, and obtained via DI through the component's constructor.  That doesn't
  apply here, so we'll explicitly implement it as a singleton.
*/
export class RecentlyOpenedService {
  public recentlyOpened$: ReplaySubject<RecentItem[]> = new ReplaySubject<RecentItem[]>();
  private static _instance: RecentlyOpenedService;
// TODO: nothing else should be editing the 'recently opened' values, but should we specify the `watch` option here, just in case?
// TODO: create and pass a 'master' schema (made from the interfaces??)?
  private _store = new Store();
  private readonly _recentlyOpened: Map<string, RecentItem> = new Map<string, RecentItem>();

  private constructor() {
    const recentlyOpened: RecentItem[] = this._store.get(RECENTLY_OPENED_KEY, []) as RecentItem[];
    const start: number = Math.max(0, recentlyOpened.length - MAX_RECENTLY_OPENED_ITEMS);  /* Just in case... */

    /* Maps always add new items at the end so the array needs to be reversed before adding */
    const recentItems: RecentItem[] = recentlyOpened.reverse();

    for (let i: number = start; i < recentItems.length; i++) {
      const recentItem: RecentItem = recentItems[i];
      const key: string = recentItem.label.toLocaleUpperCase();

      this._recentlyOpened.set(key, recentItem);
    }

    this.emitNewList();
  }

  public static get instance(): RecentlyOpenedService {
    return this._instance || (this._instance = new this());
  }

  public add(recentItem: RecentItem): void {
    const key: string = recentItem.label.toLocaleUpperCase();

    /* Delete and re-add so if it's already been defined, it goes at the end of the list
      (i.e. in order of use).
    */
    this._recentlyOpened.delete(key);
    this._recentlyOpened.set(key, recentItem);

    const keys: string[] = Array.from(this._recentlyOpened.keys());

    for (let i: number = 0; i < keys.length - MAX_RECENTLY_OPENED_ITEMS; i++) {
      this._recentlyOpened.delete(keys[i]);
    }

    this.emitNewList();
  }

  public clear(): void {
    this._recentlyOpened.clear();
    this.emitNewList();
  }

  private emitNewList(): void {
    /* New values are always inserted at the end of Maps, but we want them at the top of the
      'Recently Opened' list, so need to reverse them.
    */
    const recentItems: RecentItem[] = Array.from(this._recentlyOpened.values())
                                           .reverse();
    this.recentlyOpened$.next(recentItems);
    this._store.set(RECENTLY_OPENED_KEY, recentItems);
  }
}
