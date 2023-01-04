import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { Logger } from 'src/app/core/model';
import { LogService } from 'src/app/services';
import { ModalComponent } from '../../ui-components';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateEditorComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'template-editor-element';
  private _htmlContent: string = '';
  private readonly _log: Logger;

  constructor(private _formBuilder: FormBuilder,
              logService: LogService) {
    super();

    this._log = logService.getLogger('TemplateEditorComponent');
  }

  public ngOnInit(): void {
/* eslint-disable @typescript-eslint/unbound-method */
    this.formGroup = this._formBuilder.group({
      editor: [this._htmlContent]
/* eslint-enable @typescript-eslint/unbound-method */
    });
  }

  @Input()
  public get htmlContent(): string {
    return this._htmlContent;
  }
  public set htmlContent(htmlContent: string) {
    this._htmlContent = htmlContent;

    if (this.isFormInitialized()) {
      this.formGroup.patchValue({
        editor: this._htmlContent
      });
    }
  }

  public onSubmit(): void {
    if (this.isFormValid()) {
      const formValues: any = this.formGroup.value;
      this.ok(formValues.editor);
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }
}
