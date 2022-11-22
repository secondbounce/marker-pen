import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TabManagerService } from 'src/app/services';
import { TabstripComponent } from './tabstrip.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    TabstripComponent
  ],
  declarations: [
    TabstripComponent
  ],
  providers: [
    TabManagerService
  ]
})
export class TabstripModule {}
