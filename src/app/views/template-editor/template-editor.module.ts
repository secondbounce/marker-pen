import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TemplateEditorComponent } from './template-editor.component';

export { TemplateEditorComponent } from './template-editor.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSvgIconModule
  ],
  exports: [
    TemplateEditorComponent
  ],
  declarations: [
    TemplateEditorComponent
  ],
  providers: []
})
export class TemplateEditorModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(TemplateEditorComponent,
                                                                      { injector });
    customElements.define(TemplateEditorComponent.elementTag, constructor);
  }
}
