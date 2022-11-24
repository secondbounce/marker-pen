import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PreviewDirective } from 'src/app/ui-components/preview/preview.directive';
import { MarkdownFilePage } from './markdown-file.page';

export { MarkdownFilePage } from './markdown-file.page';

@NgModule({
  imports: [
    CommonModule,
    PreviewDirective
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
