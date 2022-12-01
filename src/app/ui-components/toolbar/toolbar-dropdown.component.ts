import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { ToolbarButton, ToolbarCheckbox, ToolbarControlResult, ToolbarControlType, ToolbarDropdown } from './toolbar-types';

@Component({
  selector: 'app-toolbar-dropdown',
  templateUrl: './toolbar-dropdown.component.html',
  styleUrls: ['./toolbar-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class ToolbarDropdownComponent {
  @Input() public dropdown!: ToolbarDropdown;
  @Output() public dropdownChange: EventEmitter<ToolbarControlResult> = new EventEmitter<ToolbarControlResult>();

  @Input()
  public get control(): ToolbarButton | ToolbarCheckbox | ToolbarDropdown {
    return this.dropdown;
  }
  public set control(control: ToolbarButton | ToolbarCheckbox | ToolbarDropdown) {
    if (control.type === ToolbarControlType.Dropdown) {
      this.dropdown = control as ToolbarDropdown;
    } else {
      throw new Error('Control must be a ToolbarDropdown');
    }
  }

  public onDropdownClick($event: Event): void {
    const select: HTMLSelectElement = $event.target as HTMLSelectElement;

    this.dropdownChange.emit({
      id: this.dropdown.id,
      value: select.value
    });
  }
}
