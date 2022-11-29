import { Injectable } from '@angular/core';

import { Stylesheet } from '../core/model';
import { MessageType } from '../enums';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class StylesheetService {
  constructor(private _messageService: MessageService) {}


  public setActiveStylesheet(stylesheet: string): void {
    this._messageService.send(MessageType.SetActiveStylesheet, stylesheet);
  }

  public getStylesheet(mdFilePath: string | undefined): Promise<Stylesheet> {
    return this._messageService.request(MessageType.GetStylesheet, mdFilePath);
  }
}
