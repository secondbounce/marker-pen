import { EventEmitter, Injectable } from '@angular/core';

import { RendererRequest } from '~shared/enums';
import { Stylesheet } from '../core/model';
import { MessageType } from '../enums';
import { BaseService } from './base.service';
import { ElectronService } from './electron.service';
import { LogService } from './log.service';
import { MessageService } from './message.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class StylesheetService extends BaseService {
  public activeStylesheetChanged: EventEmitter<string> = new EventEmitter<string>();
  private _activeStylesheet: string = '';

  constructor(private _settingsService: SettingsService,
              private _messageService: MessageService,
              private _electronService: ElectronService,
              logService: LogService) {
    super(logService);
  }

  public getAvailableStylesheets(): Promise<string[]> {
    const stylesheets: string[] = this._settingsService.availableStylesheets;

    this.log.assert(stylesheets.length > 0, 'No available stylesheets found in settings');
    this.setActiveStylesheet(stylesheets);

    return Promise.resolve(stylesheets);
  }

  public get activeStylesheet(): string {
    return this._activeStylesheet;
  }
  public set activeStylesheet(stylesheet: string) {
    if (stylesheet !== this._activeStylesheet) {
      this._activeStylesheet = stylesheet;

      this._messageService.send(MessageType.SetActiveStylesheet, stylesheet);
      this.activeStylesheetChanged.emit(stylesheet);
    }
  }

  public async getLastUsedStylesheet(mdFilePath: string | undefined): Promise<Stylesheet> {
    const cssFilePath: string = this._activeStylesheet;

    if (mdFilePath) {
// TODO: look up last stylesheet used for this file (for now, just use active)
    }

    return this.getStylesheet(cssFilePath);
  }

  public async getStylesheet(cssFilePath: string): Promise<Stylesheet> {
    const stylesheet: Stylesheet = {
      filepath: cssFilePath,
      css: ''
    };
    const css: any = await this._electronService.emitRendererRequest(RendererRequest.GetStylesheet,
                                                                     cssFilePath);
    if (typeof (css) === 'string') {
      stylesheet.css = css;
    }

    return stylesheet;
  }

  private setActiveStylesheet(stylesheets: string[]): void {
    if (stylesheets.length > 0) {
      if (this._activeStylesheet.length === 0) {
        this._activeStylesheet = stylesheets[0];
      } else {
        /* Make sure it's still available */
        let activeStylesheet: string | undefined = this._activeStylesheet.toLocaleUpperCase();
        activeStylesheet = stylesheets.find(stylesheet => stylesheet.toLocaleUpperCase() === activeStylesheet);

        if (typeof(activeStylesheet) === 'undefined') {
          this._activeStylesheet = stylesheets[0];
        }
      }
    }
  }
}
