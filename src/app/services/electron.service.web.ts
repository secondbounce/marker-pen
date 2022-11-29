import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppInfo } from '~shared/app-info';
import { Logger } from '../core/model';
import { Channel, RendererEvent, RendererRequest } from '../enums';
import { isElectron } from '../utility';
import { LogService } from './log.service';

const DEFAULT_STYLESHEET: string = '(default)';
const DEFAULT_STYLESHEET_PATH: string = 'assets/resources/default.css';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private _appInfo: AppInfo = {
    appName: 'Meditor'  /* Default if running in browsers */
  };
  private readonly _log: Logger;

  constructor(private _httpClient: HttpClient,
              logService: LogService) {
    this._log = logService.getLogger('ElectronService.Web');

    if (isElectron()) {
      this._log.warn('ElectronService.Web being instantiated in Electron environment');
    } else {
      this._log.info('ElectronService instantiated in non-Electron environment - using ElectronService.Web instead');
    }
  }

  public get appName(): string {
    return this._appInfo.appName;
  }

  public on(channel: Channel, _listener: (...args: any[]) => void): void {
    this._log.info(`Listener setting up on channel '${channel}' (will not be receiving messages though)`);
  }

  public emitRendererRequest(request: RendererRequest, ..._args: any[]): Promise<any> {
    let result: Promise<any>;

    switch (request) {
      case RendererRequest.GetAvailableStylesheets:
        result = Promise.resolve([DEFAULT_STYLESHEET]);
        break;

      case RendererRequest.GetStylesheet:
        result = firstValueFrom(this._httpClient.get(DEFAULT_STYLESHEET_PATH,
                                                     { observe: 'body',
                                                       responseType: 'text'
                                                     }));
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

  public emitRendererEvent(event: RendererEvent, ...args: any[]): void {
    this._log.info(`Sending event '${event}' with args ${args} (will not be received though)`);
  }
}
