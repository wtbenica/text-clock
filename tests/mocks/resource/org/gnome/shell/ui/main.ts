/*
 * Mock for GNOME Shell main UI components
 */

import { BoxLayout } from '../../../gi/St';

export const DateMenuButton = class {
  public _clock: any;
  public _clockDisplay: any;
  private _children: any[] = [];

  constructor() {
    const { WallClock } = require('../../../gi/GnomeDesktop');
    const { Label } = require('../../../gi/St');
    
    this._clock = new WallClock();
    this._clockDisplay = new Label();
    
    // Mock clock display box
    const clockDisplayBox = new BoxLayout();
    clockDisplayBox.add_style_class_name = jest.fn();
    clockDisplayBox.has_style_class_name = jest.fn().mockReturnValue(true);
    this._children = [clockDisplayBox];
  }

  get_children(): any[] {
    return this._children;
  }
};

export const panel = {
  statusArea: {
    dateMenu: new DateMenuButton(),
  },
};

export default {
  DateMenuButton,
  panel,
};