import { Injectable } from '@angular/core';

import { Logger } from '../core/model';
import { MessageType } from '../enums';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private _sendListeners: ((...args: any[]) => void)[] = [];
  private _requestListener: ((...args: any[]) => Promise<any>) | undefined;
  private readonly _log: Logger;

  constructor(logService: LogService) {
    this._log = logService.getLogger('MessageService');
  }

  public onSend(listener: (...args: any[]) => void): void {
    this._sendListeners.push(listener);
  }

  public onRequest(listener: (...args: any[]) => Promise<any>): void {
    if (this._requestListener) {
      throw new Error('Request listener already set');
    }

    this._requestListener = listener;
  }

  public send(message: MessageType, ...args: any[]): void {
    for (const listener of this._sendListeners) {
      listener(message, ...args);
    }
  }

  public request(message: MessageType, ...args: any[]): Promise<any> {
    let result: any = undefined;

    if (this._requestListener) {
      result = this._requestListener(message, ...args);
    } else {
      this._log.warn(`No request listener set for '${message}'`);
    }

    return result;
  }
}
