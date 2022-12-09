import { Injectable } from '@angular/core';

import { SettingKey } from '~shared/enums';
import { Settings } from '~shared/settings';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private _settings!: Settings;

  constructor(private _electronService: ElectronService) {
// TODO: not sure if this is going to be needed
    // _electronService.on(Channel.Settings, (...args) => this.handleMenuCommand(...args));
  }

  public async initialize(): Promise<void> {
    await this._electronService.emitSettingsRequest(SettingKey.All)
                               .then((settings: Settings) => {
                                  this._settings = settings;
                                });
  }

  public get availableStylesheets(): string[] {
    this.ensureSettingsInitialized();

    return this._settings.stylesheets;
  }

  private ensureSettingsInitialized():void {
    if (typeof (this._settings) === 'undefined') {
      throw new Error('Settings not initialized');
    }
  }
}
