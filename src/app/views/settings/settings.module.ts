import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { SettingsComponent } from './settings.component';

export { SettingsComponent } from './settings.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSvgIconModule
  ],
  exports: [
    SettingsComponent
  ],
  declarations: [
    SettingsComponent
  ],
  providers: []
})
export class SettingsModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(SettingsComponent,
                                                                      { injector });
    customElements.define(SettingsComponent.elementTag, constructor);
  }
}
