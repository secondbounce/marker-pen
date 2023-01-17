/* If you import a module but never use any of the imported values other than as TypeScript types,
  the resulting javascript file will look as if you never imported the module at all.
*/
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import { firstValueFrom } from 'rxjs';

import { AppInfo, Channel, DEFAULT_STYLESHEET, RendererEvent, RendererRequest, SettingKey, Settings, stringify } from '~shared/index';
import { LogService } from './log.service';
import { Logger } from '../core/model';
import { isElectron } from '../utility';

const DEFAULT_STYLESHEET_PATH: string = 'assets/resources/default.css';
const SAMPLE_STYLESHEET_PATH: string = 'assets/resources/dummy.css';

/**
 * This is basically a clone of the 'real' ElectronService, designed to provide dummy responses in
 * the event that it is not being within the Electron renderer process, i.e. when debugging in a
 * standard browser.
 */
@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  public readonly webFrame?: typeof webFrame;
  public readonly childProcess?: typeof childProcess;
  public readonly fs?: typeof fs;
  private readonly _ipcRenderer?: typeof ipcRenderer;
  private _appInfo: AppInfo = {
    appName: 'MarkerPen'  /* Default if running in browsers */
  };
  private _settings: Settings = {
    stylesheets: [
      DEFAULT_STYLESHEET,
      SAMPLE_STYLESHEET_PATH
    ],
    defaultStylesheet: DEFAULT_STYLESHEET,
    pdfFormat: {
      paperFormat: 'a4',
      landscape: false,
      margins: {
        top: '15mm',
        bottom: '15mm',
        left: '20mm',
        right: '20mm'
      },
      displayHeader: true,
      displayFooter: true,
      headerTemplate: '<header class="title"></header>',
      footerTemplate: '<footer><span class="pageNumber"></span>/<span class="totalPages"></span></footer>'
    }
  };

  private readonly _log: Logger;

  constructor(private _httpClient: HttpClient,
              logService: LogService) {
    this._log = logService.getLogger('ElectronService.Web');

    if (isElectron()) {
      this._log.info('ElectronService.Web being instantiated in Electron environment');

      this._ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.fs = window.require('fs');

      this.childProcess = window.require('child_process');
      this.childProcess?.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          this._log.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          this._log.error(`stderr: ${stderr}`);
          return;
        }
        this._log.debug(`stdout: ${stdout}`);
      });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args

      this._ipcRenderer?.on(Channel.AppInfo, (_event, ...args) => {
                          this._appInfo = args[0];
                        });
    } else {
      this._log.info('ElectronService instantiated in non-Electron environment - using ElectronService.Web instead');
    }
  }

  public get appName(): string {
    return this._appInfo.appName;
  }

  public on(channel: Channel, listener: (...args: any[]) => void): void {
    if (this._ipcRenderer) {
      this._ipcRenderer.on(channel, (_event, ...args) => listener(...args));
    } else {
      this._log.info(`Listener setting up on channel '${channel}' (will not be receiving messages though)`);
    }
  }

  public emitSettingsRequest(settingKey: SettingKey, ...args: any[]): Promise<any> {
    if (this._ipcRenderer) {
      return this._ipcRenderer.invoke(Channel.Settings, settingKey, ...args);
    } else {
      let result: any;

      switch (settingKey) {
        case SettingKey.All:
          result = this._settings;
          break;

        default: {
          const message: string = `Unrecognized SettingKey value - ${settingKey}`;
          this._log.error(message);
          return Promise.reject(message);
        }
      }

      return Promise.resolve(result);
    }
  }

  public emitSettingsEvent(settingKey: SettingKey, ...args: any[]): void {
    if (this._ipcRenderer) {
      this._ipcRenderer?.send(Channel.Settings, settingKey, ...args);
    } else {
      this._log.info(`Sending Settings event for '${settingKey}' with args ${stringify(args)} (will not be received though)`);

      switch (settingKey) {
        case SettingKey.All: {
          const [settings] = args;
          this._settings = settings;
          break;
        }
        default: {
          const message: string = `Unrecognized SettingKey value - ${settingKey}`;
          this._log.error(message);
        }
      }
    }
  }

  public emitRendererRequest(request: RendererRequest, ...args: any[]): Promise<any> {
    if (this._ipcRenderer) {
      return this._ipcRenderer.invoke(Channel.RendererRequest, request, ...args);
    } else {
      let result: Promise<any>;

      switch (request) {
        case RendererRequest.GetStylesheet: {
          let [filepath] = args;

          if (filepath === DEFAULT_STYLESHEET) {
            filepath = DEFAULT_STYLESHEET_PATH;
          }

          result = firstValueFrom(this._httpClient.get(filepath,
                                                       { observe: 'body',
                                                         responseType: 'text'
                                                       }));
          break;
        }
        case RendererRequest.SelectStylesheet:
          result = Promise.resolve('/foo/bar/baz/styles.css');
          break;

        default: {
          const message: string = `Unrecognized RendererRequest value - ${request}`;
          this._log.error(message);
          result = Promise.reject(message);
          break;
        }
      }

      return result;
    }
  }

  public emitRendererEvent(event: RendererEvent, ...args: any[]): void {
    if (this._ipcRenderer) {
      this._ipcRenderer.send(Channel.RendererEvent, event, ...args);
    } else {
      this._log.info(`Sending event '${event}' with args ${stringify(args)} (will not be received though)`);
    }
  }
}
