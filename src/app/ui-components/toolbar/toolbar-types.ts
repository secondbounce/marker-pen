export /* not const*/ enum ToolbarControlType {
  Button,
  Checkbox,
  Dropdown
}

export type ToolbarControls = (ToolbarButton | ToolbarCheckbox | ToolbarDropdown)[];

export interface ToolbarControl {
  id: string;
  type: ToolbarControlType;
  tooltip: string;
  enabled?: boolean;
}

export interface ToolbarButton extends ToolbarControl {
  icon: string;
}

export interface ToolbarCheckbox extends ToolbarControl {
  checked: boolean;
  icon: string;
}

export interface ToolbarDropdown extends ToolbarControl {
  selected?: string;
  options: ToolbarDropdownOption[];
}

export interface ToolbarDropdownOption {
  id: string;
  text: string;
  selected?: boolean;
}

export interface ToolbarControlResult {
  id: string;
  value?: string | boolean | undefined;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ToolbarState = {
  [id: string]: ToolbarControlState
};

export interface ToolbarControlState {
  id: string;
  value?: string | boolean | undefined;
  enabled?: boolean,
  /** Only valid for `ToolbarControlType.Dropdown` */
  options?: ToolbarDropdownOption[]
}
