import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { ToolbarButton, ToolbarCheckbox, ToolbarControlResult, ToolbarControlType, ToolbarDropdown } from './toolbar-types';

@Component({
  selector: 'app-toolbar-button',
  templateUrl: './toolbar-button.component.html',
  styleUrls: ['./toolbar-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    CommonModule,
    AngularSvgIconModule
  ]
})
export class ToolbarButtonComponent {
  public button!: ToolbarButton;
  @Output() public buttonClick: EventEmitter<ToolbarControlResult> = new EventEmitter<ToolbarControlResult>();

  @Input()
  public get control(): ToolbarButton | ToolbarCheckbox | ToolbarDropdown {
    return this.button;
  }
  public set control(control: ToolbarButton | ToolbarCheckbox | ToolbarDropdown) {
    if (control.type === ToolbarControlType.Button) {
      this.button = control as ToolbarButton;
    } else {
      throw new Error('Control must be a ToolbarButton');
    }
  }

  public onButtonClick(_$event: MouseEvent): void {
    this.buttonClick.emit({ id: this.button.id });
  }
}
