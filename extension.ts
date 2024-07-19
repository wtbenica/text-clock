/*
 * Copyright (c) 2024 Wesley Benica
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import GnomeDesktop from 'gi://GnomeDesktop';

import { DateMenuButton } from 'resource:///org/gnome/shell/ui/dateMenu.js';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';
import {
  Extension,
  gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';

import {
  TextClockLabel,
  CLOCK_LABEL_PROPERTIES,
  ITextClock,
} from './ui/clock_label.js';
import { WordPack } from './word_pack.js';
import { SETTINGS, Errors } from './constants.js';
import { TRANSLATE_PACK } from './constants_times_extension.js';

const CLOCK_STYLE_CLASS_NAME = 'clock';

/**
 * TextClock extension for GNOME Shell
 *
 * A GNOME Shell extension that hides the clock in the top bar and adds a new
 * clock label that displays the time as text, e.g. "five past noon". It can also
 * display the date and weekday, e.g. "five past noon | Monday the first".
 */
export default class TextClock extends Extension {
  #settings?: Gio.Settings;
  #dateMenu?: IDateMenuButton;
  #clock?: GnomeDesktop.WallClock;
  #clockDisplay?: St.Label;
  #topBox?: St.BoxLayout;
  #clockLabel?: ITextClock;
  #translatePack?: WordPack;

  // Lifecycle Methods
  constructor(metadata: any) {
    super(metadata);
  }

  enable() {
    this.#initSettings();
    this.#retrieveDateMenu();
    this.#placeClockLabel();
    this.#bindSettingsToClockLabel();
  }

  disable() {
    this.#restoreClockDisplay();
    this.#cleanup();
  }

  // Private Methods
  // Initialize the settings object
  #initSettings() {
    this.#settings = this.getSettings();
  }

  // Initialize class properties to undefined
  #resetProperties() {
    this.#settings = undefined;
    this.#dateMenu = undefined;
    this.#clock = undefined;
    this.#clockDisplay = undefined;
    this.#topBox = undefined;
    this.#clockLabel = undefined;
    this.#translatePack = undefined;
  }

  // Retrieve the date menu from the status area
  #retrieveDateMenu() {
    try {
      this.#dateMenu = panel.statusArea.dateMenu as IDateMenuButton;
      const { _clock, _clockDisplay } = this.#dateMenu;
      this.#clock = _clock;
      this.#clockDisplay = _clockDisplay;
    } catch (error: any) {
      logError(error, _(Errors.ERROR_RETRIEVE_DATE_MENU));
    }
  }

  // Place the clock label in the top box
  #placeClockLabel() {
    this.#translatePack = TRANSLATE_PACK();

    try {
      // Create the top box
      this.#topBox = new St.BoxLayout({
        style_class: CLOCK_STYLE_CLASS_NAME,
      });

      // Create the clock label and add it to the top box
      this.#clockLabel = new TextClockLabel({
        translatePack: this.#translatePack,
        fuzzyMinutes: this.#settings!.get_string(SETTINGS.FUZZINESS),
        showDate: this.#settings!.get_boolean(SETTINGS.SHOW_DATE),
        showWeekday: this.#settings!.get_boolean(SETTINGS.SHOW_WEEKDAY),
        timeFormat: this.#settings!.get_string(SETTINGS.TIME_FORMAT),
      });
      this.#topBox.add_child(this.#clockLabel!);

      // Insert the top box into the last position of the clock display box
      const clockDisplayBox = this.#findClockDisplayBox();
      clockDisplayBox.insert_child_at_index(
        this.#topBox,
        clockDisplayBox.get_children().length - 1,
      );

      // Remove the style class and hide the original clock display
      this.#clockDisplay!.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
      this.#clockDisplay!.set_width(0);
    } catch (error: any) {
      logError(error, _(Errors.ERROR_PLACING_CLOCK_LABEL));
    }
  }

  // Bind settings to their clock label properties
  #bindSettingsToClockLabel() {
    try {
      this.#settings!.bind(
        SETTINGS.SHOW_DATE,
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.SHOW_DATE,
        Gio.SettingsBindFlags.DEFAULT,
      );
      this.#settings!.bind(
        SETTINGS.FUZZINESS,
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.FUZZINESS,
        Gio.SettingsBindFlags.DEFAULT,
      );
      this.#settings!.bind(
        SETTINGS.SHOW_WEEKDAY,
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY,
        Gio.SettingsBindFlags.DEFAULT,
      );
      this.#settings!.bind(
        SETTINGS.TIME_FORMAT,
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.TIME_FORMAT,
        Gio.SettingsBindFlags.DEFAULT,
      );
      this.#clock!.bind_property(
        'clock',
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
        GObject.BindingFlags.DEFAULT,
      );
    } catch (error: any) {
      logError(error, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
    }
  }

  // Destroys created objects and sets properties to undefined
  #cleanup() {
    if (this.#clockLabel!) this.#clockLabel!.destroy();
    if (this.#topBox) this.#topBox.destroy();
    this.#resetProperties();
  }

  // Restore the clock display to its original appearance
  #restoreClockDisplay() {
    this.#clockDisplay!.add_style_class_name(CLOCK_STYLE_CLASS_NAME);
    this.#clockDisplay!.set_width(-1);
  }

  // Finds the St.BoxLayout child with style class 'clock-display-box'
  #findClockDisplayBox() {
    const box: St.BoxLayout | undefined = this.#dateMenu!.get_children().find(
      (child: Clutter.Actor) =>
        child instanceof St.BoxLayout &&
        child.has_style_class_name('clock-display-box'),
    ) as St.BoxLayout | undefined;

    if (!box) {
      throw new Error(_(Errors.ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX));
    }

    return box;
  }
}

/**
 * Interface to provide type safety for the date menu button
 */
interface IDateMenuButton extends DateMenuButton {
  _clock: GnomeDesktop.WallClock;
  _clockDisplay: St.Label;
}
