/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import GnomeDesktop from "gi://GnomeDesktop";

import { DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js";
import { panel } from "resource:///org/gnome/shell/ui/main.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import {
  TextClockLabel,
  CLOCK_LABEL_PROPERTIES,
  ITextClock,
} from "./ui/clock_label.js";
import { Fuzziness } from "./clock_formatter.js";
import { WordPack } from "./word_pack.js";
import { SETTINGS, Errors } from "./constants/index.js";
import {
  timesFormatOne,
  midnightFormatOne,
  noonFormatOne,
  timesFormatTwo,
  midnightFormatTwo,
  noonFormatTwo,
  hourNames,
  midnight,
  noon,
} from "./constants/times/extension.js";
import {
  weekdays,
  dateOnly,
  daysOfMonth,
} from "./constants/dates/extension.js";
import { logErr, logWarn, logInfo, logDebug } from "./utils/error-utils.js";
import { fuzzinessFromEnumIndex } from "./utils/fuzziness-utils.js";

const CLOCK_STYLE_CLASS_NAME = "clock";

/**
 * @returns a word pack that contains the strings for telling the time and date
 */
export const TRANSLATE_PACK: () => WordPack = () =>
  new WordPack({
    timesFormatOne: timesFormatOne(),
    midnightFormatOne: midnightFormatOne(),
    noonFormatOne: noonFormatOne(),
    timesFormatTwo: timesFormatTwo(),
    midnightFormatTwo: midnightFormatTwo(),
    noonFormatTwo: noonFormatTwo(),
    names: hourNames(),
    days: weekdays(),
    dayOnly: dateOnly(),
    midnight: midnight(),
    noon: noon(),
    daysOfMonth: daysOfMonth(),
  });

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
      if (!this.#dateMenu) {
        logInfo(`dateMenu not found on panel.statusArea`);
        return;
      }

      const { _clock, _clockDisplay } = this.#dateMenu as any;
      this.#clock = _clock;
      this.#clockDisplay = _clockDisplay;
    } catch (error: any) {
      logErr(error, _(Errors.ERROR_RETRIEVE_DATE_MENU));
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
        showDate: this.#settings!.get_boolean(SETTINGS.SHOW_DATE),
        showWeekday: this.#settings!.get_boolean(SETTINGS.SHOW_WEEKDAY),
        timeFormat: this.#settings!.get_string(SETTINGS.TIME_FORMAT),
        dividerText: this.#settings!.get_string(SETTINGS.DIVIDER_TEXT),
      });

      // Read fuzziness from GSettings as an enum index and map to minutes.
      // Assign via the setter (which accepts numeric or string) rather than
      // using a direct GSettings -> GObject property bind to avoid type
      // conversion ambiguity between the schema (enum) and the widget property.
      const fuzzIndex = this.#settings!.get_enum(SETTINGS.FUZZINESS);
      const fuzzValue = fuzzinessFromEnumIndex(fuzzIndex);
      if (this.#clockLabel) {
        (this.#clockLabel as any).fuzzyMinutes = fuzzValue;
      } else {
        logWarn(
          `Attempted to set fuzziness but clockLabel is undefined`,
          _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL),
        );
      }
      this.#topBox.add_child(this.#clockLabel!);

      // Apply initial styles
      this.#applyStyles();

      // Insert the top box into the clock display box. Prefer `add_child`
      // when available because it's more stable across Shell versions.
      const clockDisplayBox = this.#findClockDisplayBox();
      try {
        clockDisplayBox.add_child(this.#topBox);
      } catch (err: any) {
        logErr(err, _(Errors.ERROR_PLACING_CLOCK_LABEL));
        throw err;
      }

      // Remove the style class and hide the original clock display so our
      // text clock is visible in its place. Use hide() as it's more robust
      // across Shell versions than only setting width.
      try {
        this.#clockDisplay!.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
        this.#clockDisplay!.set_width(0);
        if (typeof (this.#clockDisplay as any).hide === "function") {
          (this.#clockDisplay as any).hide();
        }
      } catch (e: any) {
        logErr(e, _(Errors.ERROR_PLACING_CLOCK_LABEL));
      }
    } catch (error: any) {
      logErr(error, _(Errors.ERROR_PLACING_CLOCK_LABEL));
    }
  }

  // Bind settings to their clock label properties
  #bindSettingsToClockLabel() {
    if (!this.#settings) {
      logErr(
        "Settings object is undefined. Cannot bind settings to clock label.",
      );
      return;
    }

    if (!this.#clockLabel) {
      logErr("Clock label is undefined. Cannot bind settings to clock label.");
      return;
    }

    try {
      this.#settings.bind(
        SETTINGS.SHOW_DATE,
        this.#clockLabel,
        CLOCK_LABEL_PROPERTIES.SHOW_DATE,
        Gio.SettingsBindFlags.DEFAULT,
      );

      this.#settings?.connect("changed::fuzziness", () => {
        try {
          const fuzzIndex = this.#settings!.get_enum(SETTINGS.FUZZINESS);
          (this.#clockLabel as any).fuzzyMinutes =
            fuzzinessFromEnumIndex(fuzzIndex);
        } catch (e: any) {
          logErr(e, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
        }
      });

      this.#settings?.connect("changed::time-format", () => {
        const tf = this.#settings?.get_string(SETTINGS.TIME_FORMAT);
        if (tf) {
          try {
            (this.#clockLabel as any).timeFormat = tf;
          } catch (e: any) {
            logErr(e, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
          }
        }
      });

      this.#settings.bind(
        SETTINGS.SHOW_WEEKDAY,
        this.#clockLabel,
        CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY,
        Gio.SettingsBindFlags.DEFAULT,
      );

      this.#clock!.bind_property(
        "clock",
        this.#clockLabel,
        CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
        GObject.BindingFlags.DEFAULT,
      );

      this.#settings.connect("changed::clock-color", () => this.#applyStyles());
      this.#settings.connect("changed::date-color", () => this.#applyStyles());
      this.#settings.connect("changed::divider-color", () =>
        this.#applyStyles(),
      );
      this.#settings.connect("changed::divider-text", () =>
        this.#applyStyles(),
      );
    } catch (error: any) {
      logErr(error, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
    }
  }

  // Apply styles to the clock label
  #applyStyles() {
    if (!this.#clockLabel) return;
    this.#clockLabel.setClockColor(this.#settings!.get_string("clock-color"));
    this.#clockLabel.setDateColor(this.#settings!.get_string("date-color"));
    this.#clockLabel.setDividerColor(
      this.#settings!.get_string("divider-color"),
    );
    this.#clockLabel.setDividerText(this.#settings!.get_string("divider-text"));
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
    if (typeof (this.#clockDisplay as any).show === "function") {
      (this.#clockDisplay as any).show();
    }
  }

  // Finds the St.BoxLayout child with style class 'clock-display-box'
  #findClockDisplayBox() {
    const children = (this.#dateMenu as any)?.get_children
      ? (this.#dateMenu as any).get_children()
      : [];

    const box: St.BoxLayout | undefined = children.find(
      (child: Clutter.Actor) =>
        child instanceof St.BoxLayout &&
        child.has_style_class_name("clock-display-box"),
    ) as St.BoxLayout | undefined;

    if (box) {
      return box;
    }

    // Fallbacks for panels/ shells where the class name differs. Try to
    // find a reasonable container (first BoxLayout) and log for debugging.
    for (const child of children) {
      if (child instanceof St.BoxLayout) {
        return child as St.BoxLayout;
      }
    }

    logErr(`could not find suitable clock display box`);
    throw new Error(_(Errors.ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX));
  }
}

/**
 * Interface to provide type safety for the date menu button
 */
interface IDateMenuButton extends DateMenuButton {
  _clock: GnomeDesktop.WallClock;
  _clockDisplay: St.Label;
}
