/*
 * Mock for Gio from gi://Gio
 */

export const SettingsBindFlags = {
  DEFAULT: 'default',
  GET: 'get',
  SET: 'set',
  NO_SENSITIVITY: 'no-sensitivity',
  GET_NO_CHANGES: 'get-no-changes',
  INVERT_BOOLEAN: 'invert-boolean',
};

export class Settings {
  private _settings: Map<string, any> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: any[]) {
    // Mock settings object
  }

  get_string(key: string): string {
    return this._settings.get(key) || '';
  }

  get_boolean(key: string): boolean {
    return this._settings.get(key) || false;
  }

  get_int(key: string): number {
    return this._settings.get(key) || 0;
  }

  set_string(key: string, value: string): void {
    this._settings.set(key, value);
  }

  set_boolean(key: string, value: boolean): void {
    this._settings.set(key, value);
  }

  set_int(key: string, value: number): void {
    this._settings.set(key, value);
  }

  bind = jest.fn();
  connect = jest.fn();
  disconnect = jest.fn();
}

export default {
  Settings,
  SettingsBindFlags,
};