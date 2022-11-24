export /* not const*/ enum ToolbarControlType {
  Button,
  Checkbox,
  Dropdown
}

export interface ToolbarControl {
  id: string;
  type: ToolbarControlType;
  tooltip: string;
}

export interface ToolbarButton extends ToolbarControl {
  icon: string;
}

export interface ToolbarCheckbox extends ToolbarControl {
  checked: boolean;
  icon: string;
}

export interface ToolbarDropdown extends ToolbarControl {
  selected: string;
  options: { id: string, text: string }[] | undefined;
}

export interface ToolbarControlResult {
  id: string;
  value?: string | boolean | undefined;
}
