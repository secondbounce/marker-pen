import { Menu, MenuItem } from 'electron';

import { Logger } from '../logger';
import { MenuItemState } from '../shared/menu-item-state';
import { convertToText } from '../shared/string';

const ALWAYS_ENABLED_ROLES: string[] = [
  'close',
  'quit',
  'editMenu',
  'services',
  'hide',
  'hideOthers',
  'unhide'
];

/**
 * NOTE  Because Electron doesn't currently provide a way to remove menu items, we're having
 * to recreate the menu when items are being added/removed from the 'Recently Used' servers
 * menu.  This means that we can't just hold a reference to the menu and use that internally
 * since it will be redundant as soon as the menu is recreated.
 */
export class MenuStateService {
  private static _instance: MenuStateService;
  private _lastMenuState: Map<string, MenuItemState> = new Map<string, MenuItemState>();
  private readonly _log: Logger;

  constructor() {
    this._log = new Logger('MenuStateService');
  }

  public static get instance(): MenuStateService {
    return this._instance || (this._instance = new this());
  }

  public setState(menuState: MenuItemState[]): void {
    const mainMenu: Menu = this.getMainMenu();

    for (const itemState of menuState) {
      const menuId: string = itemState.id;

      /* If this is called while the main menu is disabled, just change the corresponding value
        in the saved state as it'll get set later.
      */
      if (this._lastMenuState.has(menuId)) {
        this._lastMenuState.set(menuId, { ...itemState });  /* Clone the state to avoid side effects */
      } else {
        const menuItem: MenuItem = this.getMenuItem(mainMenu, menuId);
        this.setMenuItemState(menuItem, itemState);
      }
    }
  }

  public setMainMenuState(enabled: boolean): void {
    if (enabled) {
      this.restoreMainMenu();
    } else {
      this.disableMainMenu();
    }
  }

  private disableMainMenu(): void {
    /* If the menu has already been disabled, we don't want to do it again (which would
      overwrite the saved state with all disabled states).
    */
    if (this._lastMenuState.size === 0) {
      const mainMenu: Menu = this.getMainMenu();
      this.disableMenu(mainMenu, []);
    }
  }

  private disableMenu(menu: Menu, ancestors: MenuItem[]): void {
    /* There is no mechanism for finding an item's parent menu, so we must explicitly construct an
      array of ancestors as we traverse down the menu structure.
    */
    for (const menuItem of menu.items) {
      if (menuItem.type !== 'separator') {
        if (menuItem.role && ALWAYS_ENABLED_ROLES.includes(menuItem.role)) {
          /* This item doesn't need to be updated, but its parents must be in order for this item
            to be accessible.
          */
          this.enableParentMenus(ancestors);
        } else {
          /* Disable this menu item, *plus* all of its submenu items, since if one of them is an
            'always enabled' item, we'll end up having to re-enable this item in order to allow
            access to the submenu item (which would also allow access to the others if they weren't
            disabled individually).
          */
          this.disableMenuItem(menuItem);

          if (menuItem.submenu) {
            this.disableMenu(menuItem.submenu, [...ancestors, menuItem]);   /* Need to clone array */
          }
        }
      }
    }
  }

  private enableParentMenus(ancestors: MenuItem[]): void {
    for (const menuItem of ancestors) {
      menuItem.enabled = true;

      const state: MenuItemState | undefined = this._lastMenuState.get(menuItem.id);
      if (state) {
        state.enabled = true;
      }
    }
  }

  private disableMenuItem(menuItem: MenuItem): void {
    const state: MenuItemState = this.getMenuItemState(menuItem);

    this._lastMenuState.set(menuItem.id, state);
    menuItem.enabled = false;
  }

  private restoreMainMenu(): void {
    const mainMenu: Menu = this.getMainMenu();
    let menuItem: MenuItem;

    for (const [menuId, state] of this._lastMenuState) {
      menuItem = this.getMenuItem(mainMenu, menuId);
      this.setMenuItemState(menuItem, state);
    }

    this._lastMenuState.clear();
  }

  private getMainMenu(): Menu {
    const menu: Menu | null = Menu.getApplicationMenu();
    if (menu === null) {
      this._log.error('Application menu has not been set');
      throw new Error('Application menu has not been set');
    }

    return menu;
  }

  private getMenuItem(menu: Menu, menuId: string): MenuItem {
    const menuItem: MenuItem | null = menu.getMenuItemById(menuId);

    if (menuItem === null) {
      const message: string = `Menu item ${menuId} could not be found`;
      this._log.error(message);
      throw new Error(message);
    }

    return menuItem;
  }

  private getMenuItemState(menuItem: MenuItem): MenuItemState {
    this._log.assert(typeof(menuItem.id) === 'undefined',
                     `Menu item has not been assigned an id - ${convertToText(menuItem)}`);

    const state: MenuItemState = {
      id: menuItem.id,
      enabled: menuItem.enabled
    };

    if (menuItem.type === 'checkbox' || menuItem.type === 'radio') {
      state.checked = menuItem.checked;
    }

    return state;
  }

  public setMenuItemState(menuItem: MenuItem, state: MenuItemState): void {
    menuItem.enabled = state.enabled;

    if (typeof(state.checked) !== 'undefined') {
      menuItem.checked = state.checked;
    }
  }
}
