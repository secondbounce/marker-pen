import { Injectable } from '@angular/core';

import { PdfFormat, SettingKey, Settings } from '~shared/index';
import { ElectronService } from './electron.service';
import { clone } from '../utility';

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

    return [...this._settings.stylesheets];
  }

  public get defaultStylesheet(): string {
    this.ensureSettingsInitialized();

    return this._settings.defaultStylesheet;
  }

  public get pdfFormat(): PdfFormat {
    this.ensureSettingsInitialized();

    return this._settings.pdfFormat;
  }

  public get settings(): Settings {
    this.ensureSettingsInitialized();

    return clone(this._settings);
  }
  public set settings(settings: Settings) {
    this.ensureSettingsInitialized();

    this._settings = clone(settings);
    this._electronService.emitSettingsEvent(SettingKey.All, settings);
  }

  private ensureSettingsInitialized():void {
    if (typeof (this._settings) === 'undefined') {
      throw new Error('Settings not initialized');
    }
  }
}
