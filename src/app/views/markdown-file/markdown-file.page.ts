import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Logger, MarkdownFile } from 'src/app/core/model';
import { LogService } from 'src/app/services';
import { TabPanelComponent } from 'src/app/tabs';

@Component({
  selector: 'app-markdown-file',
  templateUrl: './markdown-file.page.html',
  styleUrls: ['./markdown-file.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MarkdownFilePage extends TabPanelComponent<MarkdownFile> {
  private readonly _log: Logger;

  constructor(logService: LogService) {
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
  }
}
