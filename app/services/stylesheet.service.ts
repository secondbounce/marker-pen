import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '../logger';
import { DEFAULT_STYLESHEET } from '../shared/constants';

export const DEFAULT_STYLESHEET_FILENAME: string = 'default.css';

export class StylesheetService {
  private static _instance: StylesheetService;
  private readonly _log: Logger;

  constructor(private _userDataFolder: string) {
    this._log = new Logger('StylesheetService');
  }

  public static instance(userDataFolder: string): StylesheetService {
    return this._instance || (this._instance = new this(userDataFolder));
  }

  public getStylesheet(cssFilePath: string): string {
    let css: string = '';

    if (cssFilePath === DEFAULT_STYLESHEET) {
      cssFilePath = path.join(this._userDataFolder, DEFAULT_STYLESHEET_FILENAME);
    }

    try {
      const data: Buffer = fs.readFileSync(cssFilePath);
      css = data.toString(); /* Using 'utf8' by default */
    } catch (err) {
// TODO: need to display the error message somehow
      this._log.error(`Failed to open stylesheet file ${cssFilePath}`, err);
    }

    return css;
  }
}
