import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { convertToText, DEFAULT_STYLESHEET, PdfFormat, RendererRequest, Settings } from '~shared/index';
import { Logger } from 'src/app/core/model';
import { ElectronService, LogService, ModalService, SettingsService } from 'src/app/services';
import { ModalComponent, ModalResult } from '../../ui-components';
import { TemplateEditorComponent } from '../template-editor/template-editor.module';

interface StylesheetOption {
  name: string;
  canRemove: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'settings-element';
  public activePane: string = 'stylesheets';
  public stylesheets: StylesheetOption[] = [];
  private _settings: Settings = {
    stylesheets: [],
    defaultStylesheet: '',
    pdfFormat: {
      paperFormat: 'a4',
      landscape: false,
      margins: {
        top: '',
        bottom: '',
        left: '',
        right: ''
      },
      displayHeader: false,
      displayFooter: false
    }
  };
  private readonly _log: Logger;

  constructor(private _settingsService: SettingsService,
              private _electronService: ElectronService,
              private _modalService: ModalService,
              private _formBuilder: FormBuilder,
              private _cdRef: ChangeDetectorRef,
              logService: LogService) {
    super();

    this._log = logService.getLogger('SettingsComponent');
  }

  public ngOnInit(): void {
    this._settings = this._settingsService.settings;
    this.setUpStylesheets(this._settings);

    const pdfFormat: PdfFormat = this._settings.pdfFormat;
    const [topMarginValue, topMarginUnits] = this.splitMarginSetting(pdfFormat.margins.top);
    const [bottomMarginValue, bottomMarginUnits] = this.splitMarginSetting(pdfFormat.margins.bottom);
    const [leftMarginValue, leftMarginUnits] = this.splitMarginSetting(pdfFormat.margins.left);
    const [rightMarginValue, rightMarginUnits] = this.splitMarginSetting(pdfFormat.margins.right);

/* eslint-disable @typescript-eslint/unbound-method */
    this.formGroup = this._formBuilder.group({
      panes: [this.activePane],
      defaultStylesheet: [this._settings.defaultStylesheet],
      paperFormat: [pdfFormat.paperFormat],
      orientation: [pdfFormat.landscape ? 'landscape' : 'portrait'],
      topMarginValue: [topMarginValue],
      topMarginUnits: [topMarginUnits],
      bottomMarginValue: [bottomMarginValue],
      bottomMarginUnits: [bottomMarginUnits],
      leftMarginValue: [leftMarginValue],
      leftMarginUnits: [leftMarginUnits],
      rightMarginValue: [rightMarginValue],
      rightMarginUnits: [rightMarginUnits],
      displayHeader: [pdfFormat.displayHeader],
      displayFooter: [pdfFormat.displayFooter]
/* eslint-enable @typescript-eslint/unbound-method */
    });
  }

  private setUpStylesheets(settings: Settings): void {
    this.stylesheets.length = 0;

    settings.stylesheets.forEach(stylesheet => {
      const option: StylesheetOption = {
        name: stylesheet,
        canRemove: stylesheet !== DEFAULT_STYLESHEET
      };
      this.stylesheets.push(option);
    });
  }

  private splitMarginSetting(margin: string): [number, string] {
    const regex: RegExp = /\s*(\d{1,})(?:\s*)(mm|in)\s*/;
    const matches: RegExpExecArray | null = regex.exec(margin);
    let value: number = 0;
    let units: string = 'mm';

    if (matches) {
      value = parseInt(matches[1]);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- just a regex array index
      units = matches[2];
    }

    return [value, units];
  }

  private combineMarginSetting(marginValue: number, marginUnits: string): string {
    return marginValue.toString() + marginUnits.trim().toLowerCase();
  }

  public setActivePane($event: Event): void {
    const radioButton: HTMLInputElement = $event.currentTarget as HTMLInputElement;
    this.activePane = radioButton.value;
  }

  public addStylesheet(): void {
    this._electronService.emitRendererRequest(RendererRequest.SelectStylesheet)
                         .then((stylesheet: string | undefined) => {
                            if (stylesheet) {
                              this._settings.stylesheets.push(stylesheet);
                              this.setUpStylesheets(this._settings);
                              this._cdRef.markForCheck();
                            }
                          });
  }

  public removeStylesheet(stylesheet: string): void {
    const stylesheets: string[] = this._settings.stylesheets;
    const index: number = stylesheets.indexOf(stylesheet);

    if (index >= 0) {
      if (stylesheets.length > 0) {
        let defaultStylesheet: string = this.formGroup.value.defaultStylesheet;

        this._settings.stylesheets.splice(index, 1);
        this.setUpStylesheets(this._settings);

        if (stylesheet === defaultStylesheet) {
          /* Make sure there's always a default stylesheet */
          defaultStylesheet = stylesheets[0];
          this._settings.defaultStylesheet = defaultStylesheet;
          this.formGroup.patchValue({ defaultStylesheet });
        }
      } else {
        this._log.error(`'${stylesheet}' cannot be removed as it's the only available stylesheet`);
      }
    } else {
      this._log.error(`'${stylesheet}' is not in available stylesheets ${convertToText(stylesheets)}`);
    }
  }

  public editHeaderFooter(editHeader: boolean): void {
    this._modalService.show<TemplateEditorComponent>(TemplateEditorComponent.elementTag,
                                                         {
                                                          htmlContent: editHeader ? this._settings.pdfFormat.headerTemplate
                                                                                  : this._settings.pdfFormat.footerTemplate
                                                         })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            if (editHeader) {
                              this._settings.pdfFormat.headerTemplate = result.data;
                            } else {
                              this._settings.pdfFormat.footerTemplate = result.data;
                            }
                          }
                        },
                        error: (error: any) => {
// TODO: need to display the error message somehow
                          this._log.warn(error);
                        }
                      });
  }

  public onSubmit(): void {
    if (this.isFormValid()) {
      const formValues: any = this.formGroup.value;
      const pdfFormat: PdfFormat = this._settings.pdfFormat;
      const topMargin: string = this.combineMarginSetting(formValues.topMarginValue, formValues.topMarginUnits);
      const bottomMargin: string = this.combineMarginSetting(formValues.bottomMarginValue, formValues.bottomMarginUnits);
      const leftMargin: string = this.combineMarginSetting(formValues.leftMarginValue, formValues.leftMarginUnits);
      const rightMargin: string = this.combineMarginSetting(formValues.rightMarginValue, formValues.rightMarginUnits);

      this._settings.defaultStylesheet = formValues.defaultStylesheet;
      pdfFormat.paperFormat = formValues.paperFormat;
      pdfFormat.landscape = formValues.orientation === 'landscape';
      pdfFormat.margins.top = topMargin;
      pdfFormat.margins.bottom = bottomMargin;
      pdfFormat.margins.left = leftMargin;
      pdfFormat.margins.right = rightMargin;
      pdfFormat.displayHeader = formValues.displayHeader;
      pdfFormat.displayFooter = formValues.displayFooter;

      this._settingsService.settings = this._settings;
      this.ok();
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }
}
