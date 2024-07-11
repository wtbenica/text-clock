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

import Gio from "gi://Gio";
import St from "gi://St";
import GObject from "gi://GObject";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import { panel } from "resource:///org/gnome/shell/ui/main.js";
import { TextClockLabel, PROPERTIES, ITextClock } from "./ui/clock_label.js";
import { SETTINGS } from "./prefs_constants.js";
import { Errors } from "./constants_en.js";
import { TRANSLATE_PACK } from "./constants.js";

const CLOCK_STYLE_CLASS_NAME = "clock";

/**
 * TextClock extension for GNOME Shell
 */
export default class TextClock extends Extension {
  #settings?: Gio.Settings;
  #dateMenu?: any;
  #clock?: St.BoxLayout;
  #clockDisplay?: St.Label;
  #topBox?: St.BoxLayout;
  #clockLabel?: ITextClock;

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
  /**
   * Initialize the settings object
   */
  #initSettings() {
    this.#settings = this.getSettings();
  }

  /**
   * Initialize class properties to null
   */
  #resetProperties() {
    this.#settings = undefined;
    this.#dateMenu = undefined;
    this.#clock = undefined;
    this.#clockDisplay = undefined;
    this.#topBox = undefined;
    this.#clockLabel = undefined;
  }

  /**
   * Retrieve the date menu from the status area
   */
  #retrieveDateMenu() {
    try {
      this.#dateMenu = panel.statusArea.dateMenu;
      const { _clock, _clockDisplay } = this.#dateMenu;
      this.#clock = _clock;
      this.#clockDisplay = _clockDisplay;
    } catch (error: any) {
      logError(error, _(Errors.ERROR_RETRIEVE_DATE_MENU));
    }
  }

  /**
   * Place the clock label in the top box
   */
  #placeClockLabel() {
    try {
      this.#topBox = new St.BoxLayout({
        style_class: CLOCK_STYLE_CLASS_NAME,
      });

      this.#clockLabel = new TextClockLabel({
        translatePack: TRANSLATE_PACK(),
        fuzzyMinutes: this.#settings!.get_string(SETTINGS.FUZZINESS),
        showDate: this.#settings!.get_boolean(SETTINGS.SHOW_DATE),
        showWeekday: this.#settings!.get_boolean(SETTINGS.SHOW_WEEKDAY),
        timeFormat: this.#settings!.get_string(SETTINGS.TIME_FORMAT),
      });
      this.#topBox.add_child(this.#clockLabel!);

      const clockDisplayBox = this.#findClockDisplayBox();
      clockDisplayBox.insert_child_at_index(
        this.#topBox,
        clockDisplayBox.get_children().length - 1
      );

      this.#clockDisplay!.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
      this.#clockDisplay!.set_width(0);
    } catch (error: any) {
      logError(error, _(Errors.ERROR_PLACING_CLOCK_LABEL));
    }
  }

  /**
   * Bind the settings to the clock label
   */
  #bindSettingsToClockLabel() {
    try {
      this.#settings!.bind(
        SETTINGS.SHOW_DATE,
        this.#clockLabel!,
        PROPERTIES.SHOW_DATE,
        Gio.SettingsBindFlags.DEFAULT
      );
      this.#settings!.bind(
        SETTINGS.FUZZINESS,
        this.#clockLabel!,
        PROPERTIES.FUZZINESS,
        Gio.SettingsBindFlags.DEFAULT
      );
      this.#settings!.bind(
        SETTINGS.SHOW_WEEKDAY,
        this.#clockLabel!,
        PROPERTIES.SHOW_WEEKDAY,
        Gio.SettingsBindFlags.DEFAULT
      );
      this.#settings!.bind(
        SETTINGS.TIME_FORMAT,
        this.#clockLabel!,
        PROPERTIES.TIME_FORMAT,
        Gio.SettingsBindFlags.DEFAULT
      );
      this.#clock!.bind_property(
        "clock",
        this.#clockLabel!,
        PROPERTIES.CLOCK_UPDATE,
        GObject.BindingFlags.DEFAULT
      );
    } catch (error: any) {
      logError(error, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
    }
  }

  /**
   * Destroys created objects
   */
  #cleanup() {
    if (this.#clockLabel!) this.#clockLabel!.destroy();
    if (this.#topBox) this.#topBox.destroy();
    this.#resetProperties();
  }

  /**
   * Restore the clock display to its original state
   */
  #restoreClockDisplay() {
    this.#clockDisplay!.add_style_class_name(CLOCK_STYLE_CLASS_NAME);
    this.#clockDisplay!.set_width(-1);
  }

  /**
   * Finds the St.BoxLayout child with style class 'clock-display-box'
   */
  #findClockDisplayBox() {
    const box: St.BoxLayout | undefined = this.#dateMenu
      .get_children()
      .find(
        (child: St.Widget) =>
          child instanceof St.BoxLayout &&
          child.has_style_class_name("clock-display-box")
      ) as St.BoxLayout | undefined;

    if (!box) {
      throw new Error(_(Errors.ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX));
    }

    return box;
  }
}
