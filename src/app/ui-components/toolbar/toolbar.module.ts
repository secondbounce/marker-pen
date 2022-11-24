import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ToolbarButtonComponent } from './toolbar-button.component';
import { ToolbarCheckboxComponent } from './toolbar-checkbox.component';
import { ToolbarDropdownComponent } from './toolbar-dropdown.component';
import { ToolbarComponent } from './toolbar.component';

export { ToolbarComponent } from './toolbar.component';
export { ToolbarControlResult, ToolbarControlType } from './toolbar-types';

@NgModule({
  imports: [
    CommonModule,
    ToolbarButtonComponent,
    ToolbarCheckboxComponent,
    ToolbarDropdownComponent
  ],
  exports: [
    ToolbarComponent
  ],
  declarations: [
    ToolbarComponent
  ],
  providers: [
  ]
})
export class ToolbarModule {}
