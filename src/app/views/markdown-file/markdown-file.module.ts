import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PreviewComponent } from 'src/app/ui-components/preview/preview.component';
import { MarkdownFilePage } from './markdown-file.page';

export { MarkdownFilePage } from './markdown-file.page';

@NgModule({
  imports: [
    CommonModule,
    PreviewComponent
  ],
  exports: [
    MarkdownFilePage
  ],
  declarations: [
    MarkdownFilePage
  ],
  providers: []
})
export class MarkdownFileModule {}
