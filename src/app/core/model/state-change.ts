import { StateChangeType } from 'src/app/enums';

export interface StateChange {
  type: StateChangeType,
  state?: any
}
