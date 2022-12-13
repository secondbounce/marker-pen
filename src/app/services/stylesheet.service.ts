import { Injectable } from '@angular/core';

import { RendererRequest } from '~shared/enums';
import { Stylesheet } from '../core/model';
import { BaseService } from './base.service';
import { ElectronService } from './electron.service';
import { LogService } from './log.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class StylesheetService extends BaseService {
  constructor(private _settingsService: SettingsService,
              private _electronService: ElectronService,
              logService: LogService) {
    super(logService);
  }

  public async getLastUsedStylesheet(mdFilePath: string | undefined): Promise<Stylesheet> {
    const cssFilePath: string = this._settingsService.defaultStylesheet;

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
}
