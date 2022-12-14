import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Logger } from 'app/logger';
import { LogService } from 'src/app/services';
import { ToolbarCheckbox,
         ToolbarControlResult,
         ToolbarControls,
         ToolbarControlState,
         ToolbarControlType,
         ToolbarDropdown,
         ToolbarState } from './toolbar-types';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ToolbarComponent {
  public readonly ToolbarControlType = ToolbarControlType;
  @Output() public controlClick: EventEmitter<ToolbarControlResult> = new EventEmitter<ToolbarControlResult>();
  @Output() public stateChanged: EventEmitter<ToolbarState> = new EventEmitter<ToolbarState>();
  protected _controls: ToolbarControls = [];
  private _state: ToolbarState = {};
  private readonly _log: Logger;

  constructor(logService: LogService) {
    this._log = logService.getLogger('ToolbarComponent');
  }

  @Input()
  public get controls(): ToolbarControls {
    const controls: ToolbarControls = [];

    for (const control of this._controls) {
      controls.push({ ...control });  /* Clone the control to isolate external changes */
    }

    return controls;
  }
  public set controls(controls: ToolbarControls) {
    this._controls = [];
    this._state = {};

    for (const control of controls) {
      control.enabled = control.enabled ?? true;  /* `enabled` is optional but defaults to true */

      const state: ToolbarControlState = {
        id: control.id,
        enabled: control.enabled ?? true
      };

      switch (control.type) {
        case ToolbarControlType.Checkbox:
          state.value = (control as ToolbarCheckbox).checked;
          break;

        case ToolbarControlType.Dropdown: {
          const dropdown: ToolbarDropdown = control as ToolbarDropdown;
          let value: string = dropdown.selected ?? '';

          if (value.length === 0 && dropdown.options.length > 0) {
            /* SELECT element will show first option as selected, so set it explicitly */
            value = dropdown.options[0].id;
            dropdown.selected = value;
          }

          state.value = value;
          break;
        }
        default:
          this._log.assert(control.type === ToolbarControlType.Button,
                           `Unrecognized toolbar control type - ${control.type}`);
          /* No value */
          break;
      }

      this._controls.push({ ...control });  /* Clone the control to isolate external changes */
      this._state[control.id] = state;
    }
  }

  /** Sets the state of the controls specified
   *
   * Note that the structure passed may contain the state for only those controls that need updating,
   * rather than all of the controls in the toolbar.
   */
  @Input()
  public get state(): ToolbarState {
    return this.cloneState();    /* Clone the control state to isolate external changes */
  }
  public set state(state: ToolbarState) {
    this._state = this.cloneState(state);   /* Clone the control state to isolate external changes */
    this.updateControlStates();
  }

  public onControlClick(result: ToolbarControlResult): void {
    /* Update the toolbar state *before* we emit the event */
    const state: ToolbarControlState = this._state[result.id];
    state.value = result.value;

    this.controlClick.emit(result);
  }

  private updateControlStates(): void {
    /* As we update the controls, we'll populate a new array  */
    const controls: ToolbarControls = [];

    for (const control of this._controls) {
      const state: ToolbarControlState = this._state[control.id];

      if (state) {
        if (typeof(state.enabled) !== 'undefined') {
          control.enabled = state.enabled;
        }

        switch (control.type) {
          case ToolbarControlType.Checkbox:
            this.updateCheckbox(control as ToolbarCheckbox, state);
            break;

          case ToolbarControlType.Dropdown:
            this.updateDropdown(control as ToolbarDropdown, state);
            break;

          default:
            this._log.assert(control.type === ToolbarControlType.Button,
                             `Unrecognized toolbar control type - ${control.type}`);
            /* No value */
            break;
        }
      }

      controls.push(control);
    }

    this._controls = controls;
  }

  private updateCheckbox(control: ToolbarCheckbox, state: ToolbarControlState): void {
    if (typeof(state.value) !== 'undefined') {
      control.checked = state.value as boolean;
    }
  }

  private updateDropdown(control: ToolbarDropdown, state: ToolbarControlState): void {
    if (state.options) {
      control.options = state.options;
    }

    if (typeof(state.value) === 'string') {
      control.selected = state.value;
      this._log.debug(`Updating toolbar dropdown: ${control.selected}`);

      for (const option of control.options) {
        option.selected = option.id === control.selected ? true : undefined;
      }
    }
}

  private cloneState(newState?: ToolbarState): ToolbarState {
    const clone: ToolbarState = {};

    for (const controlState of Object.values(this._state)) {
      const state: ToolbarControlState = newState ? newState[controlState.id] ?? controlState
                                                  : controlState;
      clone[controlState.id] = { ...state };
    }

    return clone;
  }
}
