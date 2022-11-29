import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '../logger';
import { ConfigService } from './config.service';

const DEFAULT_STYLESHEET: string = '(default)';
const DEFAULT_STYLESHEET_FILENAME: string = 'default.css';

export class StylesheetService {
  private static _instance: StylesheetService;
  private _configService: ConfigService;
  private _stylesheets: string[] = [];
  private readonly _log: Logger;

  constructor(private _userDataFolder: string) {
    this._log = new Logger('StylesheetService');
    this._configService = ConfigService.instance;
    this._stylesheets = this._configService.getStylesheets();

    if (this._stylesheets.length === 0) {
      this._stylesheets.push(DEFAULT_STYLESHEET);
    }
  }

  public static instance(userDataFolder: string): StylesheetService {
    return this._instance || (this._instance = new this(userDataFolder));
  }

  public getStylesheets(): string[] {
    return [...this._stylesheets];  /* Return a clone */
  }

  public getStylesheet(filepath: string): string {
    let css: string = '';

    if (filepath === DEFAULT_STYLESHEET) {
      filepath = path.join(this._userDataFolder, DEFAULT_STYLESHEET_FILENAME);
    }

    try {
      const data: Buffer = fs.readFileSync(filepath);
      css = data.toString(); /* Using 'utf8' by default */
    } catch (err) {
// TODO: need to display the error message somehow
      this._log.error(`Failed to open stylesheet file ${filepath}`, err);
    }

    return css;
  }
}
