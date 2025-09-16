/*
 * Mock for GNOME Shell extension resources
 */

export const gettext = jest.fn((text: string) => text);

export class Extension {
  private _settings?: any;

  constructor() {}

  getSettings(): any {
    if (!this._settings) {
      const { Settings } = require('../../../gi/Gio');
      this._settings = new Settings();
    }
    return this._settings;
  }

  enable = jest.fn();
  disable = jest.fn();
}

// Mock for extension.js
export default {
  Extension,
  gettext,
};