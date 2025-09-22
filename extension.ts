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

const CLOCK_STYLE_CLASS_NAME = "clock";

/**
 * Converts a fuzziness string setting to the corresponding Fuzziness enum value
 *
 * @param fuzzinessString - The fuzziness value as a string from settings
 * @returns The corresponding Fuzziness enum value, defaults to FIVE_MINUTES
 */
function parseFuzziness(fuzzinessString: string): Fuzziness {
  const fuzzinessValue = parseInt(fuzzinessString);
  switch (fuzzinessValue) {
    case 1:
      return Fuzziness.ONE_MINUTE;
    case 5:
      return Fuzziness.FIVE_MINUTES;
    case 10:
      return Fuzziness.TEN_MINUTES;
    case 15:
      return Fuzziness.FIFTEEN_MINUTES;
    default:
      return Fuzziness.FIVE_MINUTES; // Default fallback
  }
}

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
        log(`TextClock: dateMenu not found on panel.statusArea`);
        return;
      }
      log(`TextClock: dateMenu found`);

      const { _clock, _clockDisplay } = this.#dateMenu as any;
      this.#clock = _clock;
      this.#clockDisplay = _clockDisplay;
      log(
        `TextClock: _clock ${this.#clock ? "found" : "missing"}, _clockDisplay ${this.#clockDisplay ? "found" : "missing"}`,
      );
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
        showDate: this.#settings!.get_boolean(SETTINGS.SHOW_DATE),
        showWeekday: this.#settings!.get_boolean(SETTINGS.SHOW_WEEKDAY),
        timeFormat: this.#settings!.get_string(SETTINGS.TIME_FORMAT),
      });

      // Set fuzziness explicitly via the setter to avoid GObject property
      // binding mismatches between schema (string/enum) and numeric types.
      try {
        (this.#clockLabel as any).fuzzyMinutes = this.#settings!.get_string(
          SETTINGS.FUZZINESS,
        );
      } catch (e: any) {
        logError(e, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
      }
      this.#topBox.add_child(this.#clockLabel!);

      // Apply initial styles
      this.#applyStyles();

      // Insert the top box into the clock display box. Prefer `add_child`
      // when available because it's more stable across Shell versions.
      const clockDisplayBox = this.#findClockDisplayBox();
      try {
        if ((clockDisplayBox as any).add_child) {
          log(`TextClock: adding topBox into clockDisplayBox via add_child`);
          clockDisplayBox.add_child(this.#topBox);
          log(`TextClock: add_child completed`);
        } else {
          const children = (clockDisplayBox as any).get_children
            ? (clockDisplayBox as any).get_children()
            : [];
          const insertIndex = Math.max(0, children.length);
          log(
            `TextClock: inserting topBox into clockDisplayBox (children=${children.length}) at index ${insertIndex}`,
          );
          clockDisplayBox.insert_child_at_index(this.#topBox, insertIndex);
          log(`TextClock: insert_child_at_index completed`);
        }
      } catch (err: any) {
        logError(err, _(Errors.ERROR_PLACING_CLOCK_LABEL));
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
        log(`TextClock: original clockDisplay hidden/modified`);
      } catch (e: any) {
        logError(e, _(Errors.ERROR_PLACING_CLOCK_LABEL));
      }
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
      // Bindings for fuzziness and time-format use enum/string mismatches
      // across GSettings and our property types, so handle changes manually.
      this.#settings!.connect("changed::fuzziness", () => {
        const fuzz = this.#settings!.get_string(SETTINGS.FUZZINESS);
        try {
          (this.#clockLabel as any).fuzzyMinutes = parseFuzziness(fuzz);
        } catch (e: any) {
          logError(e, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
        }
      });
      this.#settings!.bind(
        SETTINGS.SHOW_WEEKDAY,
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY,
        Gio.SettingsBindFlags.DEFAULT,
      );
      this.#settings!.connect("changed::time-format", () => {
        const tf = this.#settings!.get_string(SETTINGS.TIME_FORMAT);
        try {
          (this.#clockLabel as any).timeFormat = tf;
        } catch (e: any) {
          logError(e, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
        }
      });
      this.#clock!.bind_property(
        "clock",
        this.#clockLabel!,
        CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
        GObject.BindingFlags.DEFAULT,
      );

      // Connect to style settings changes
      this.#settings!.connect("changed::clock-color", () =>
        this.#applyStyles(),
      );
      this.#settings!.connect("changed::date-color", () => this.#applyStyles());
      this.#settings!.connect("changed::divider-color", () =>
        this.#applyStyles(),
      );
      this.#settings!.connect("changed::font", () => this.#applyStyles());
      this.#settings!.connect("changed::divider-text", () =>
        this.#applyStyles(),
      );
    } catch (error: any) {
      logError(error, _(Errors.ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL));
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
    this.#clockLabel.setFont(this.#settings!.get_string("font"));
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
    log(`TextClock: dateMenu children count: ${children.length}`);

    const box: St.BoxLayout | undefined = children.find(
      (child: Clutter.Actor) =>
        child instanceof St.BoxLayout &&
        child.has_style_class_name("clock-display-box"),
    ) as St.BoxLayout | undefined;

    if (box) {
      log(`TextClock: found clock-display-box`);
      return box;
    }

    // Fallbacks for panels/ shells where the class name differs. Try to
    // find a reasonable container (first BoxLayout) and log for debugging.
    for (const child of children) {
      if (child instanceof St.BoxLayout) {
        log(
          `TextClock: fallback using first BoxLayout child (style_class=${(child as any).style_class})`,
        );
        return child as St.BoxLayout;
      }
      log(
        `TextClock: child type: ${child ? child.constructor.name : "unknown"}`,
      );
    }

    log(`TextClock: could not find suitable clock display box`);
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
