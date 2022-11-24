import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

import { ToolbarButton, ToolbarCheckbox, ToolbarControlResult, ToolbarControlType, ToolbarDropdown } from './toolbar-types';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ToolbarComponent {
  public readonly ToolbarControlType = ToolbarControlType;
  public controls: (ToolbarButton | ToolbarCheckbox | ToolbarDropdown)[] = [];
  @Output() public controlClick: EventEmitter<ToolbarControlResult> = new EventEmitter<ToolbarControlResult>();

  public onControlClick(result: ToolbarControlResult): void {
    this.controlClick.emit(result);
  }
}
