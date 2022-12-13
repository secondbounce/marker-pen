import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { ToolbarButton, ToolbarCheckbox, ToolbarControlResult, ToolbarControlType, ToolbarDropdown } from './toolbar-types';

@Component({
  selector: 'app-toolbar-checkbox',
  templateUrl: './toolbar-checkbox.component.html',
  styleUrls: ['./toolbar-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    CommonModule,
    AngularSvgIconModule
  ]
})
export class ToolbarCheckboxComponent {
  public checkbox!: ToolbarCheckbox;
  @Output() public checkboxChange: EventEmitter<ToolbarControlResult> = new EventEmitter<ToolbarControlResult>();

  @Input()
  public get control(): ToolbarButton | ToolbarCheckbox | ToolbarDropdown {
    return this.checkbox;
  }
  public set control(control: ToolbarButton | ToolbarCheckbox | ToolbarDropdown) {
    if (control.type === ToolbarControlType.Checkbox) {
      this.checkbox = control as ToolbarCheckbox;
    } else {
      throw new Error('Control must be a ToolbarCheckbox');
    }
  }

  public onCheckboxChange($event: Event): void {
    const checkbox: HTMLInputElement = $event.currentTarget as HTMLInputElement;
    this.checkboxChange.emit({
      id: this.checkbox.id,
      value: checkbox.checked
    });
  }
}
