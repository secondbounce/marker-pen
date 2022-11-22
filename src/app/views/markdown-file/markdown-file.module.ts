import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MarkdownFilePage } from './markdown-file.page';

export { MarkdownFilePage } from './markdown-file.page';

@NgModule({
  imports: [
    CommonModule
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
