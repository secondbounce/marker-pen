import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { Logger, MarkdownFile } from 'src/app/core/model';
import { SAMPLE_CSS } from 'src/app/sample-constants';
import { ConverterService, LogService } from 'src/app/services';
import { TabPanelComponent } from 'src/app/tabs';

@Component({
  selector: 'app-markdown-file',
  templateUrl: './markdown-file.page.html',
  styleUrls: ['./markdown-file.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MarkdownFilePage extends TabPanelComponent<MarkdownFile> {
  public markdown: SafeHtml = '';
  public html: string = '';
  public css: string = SAMPLE_CSS;
  private readonly _log: Logger;

  constructor(private _converterService: ConverterService,
              logService: LogService) {
    super();

    this._log = logService.getLogger('MarkdownFilePage');
    // this.setData({
    //   serverAlias: '',
    //   dbName: '',
    //   includeDocs: false,
    //   includeRevs: false,
    //   exportAsJson: true
    // });
  }

  public setData(data: MarkdownFile): void {
    super.setData(data);

// TODO: suffix with index of new files
    const parts: string[] = data.filepath.split(/[\\/]/);
    const title: string = data.filepath.length > 0 ? parts[parts.length - 1] : 'Untitled';
    const fullTitle: string = data.filepath.length > 0 ? data.filepath : 'Untitled';

    this.setTitle(title, fullTitle);

    this.markdown = this._converterService.plaintextToSafeHtml(data.contents, true);
    this.html = this._converterService.markdownToHtml(data.contents);
  }
}
