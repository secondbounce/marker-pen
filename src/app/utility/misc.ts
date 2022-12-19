import { stringify } from '~shared/index';

export function isElectron(): boolean {
  return !!(window && window.process && window.process.type);
}

export function clone<T>(value: T): T {
  const json: string = stringify(value);
  return JSON.parse(json);
}
