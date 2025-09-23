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
import { WordPack } from "./word_pack.js";
import { SETTINGS, Errors, getDividerText } from "./constants/index.js";
import { logErr, logWarn, logInfo } from "./utils/error-utils.js";
import { fuzzinessFromEnumIndex } from "./utils/fuzziness-utils.js";
import { createTranslatePack } from "./utils/translate-pack-utils.js";
import { extensionGettext } from "./utils/gettext-utils-ext.js";

const CLOCK_STYLE_CLASS_NAME = "clock";

/**
 * @returns a word pack that contains the strings for telling the time and date
 */
export const TRANSLATE_PACK: () => WordPack = () =>
  createTranslatePack(extensionGettext);

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
    this.#maybeShowUpdateNotification();
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

  // When the extension is enabled check whether we have a stored last-seen
  // version and, if it differs from the current metadata version-name,
  // show a short notification and persist the new version-name.
  #maybeShowUpdateNotification() {
    try {
      if (!this.#settings) return;

      // Extension metadata is provided by the base Extension class; access
      // via (this as any).metadata which mirrors metadata.json at build time.
      const meta: any = (this as any).metadata || {};
      const currentVersionName: string =
        meta["version-name"] || String(meta.version || "");
      if (!currentVersionName) return;

      const lastSeen = this.#settings.get_string(SETTINGS.LAST_SEEN_VERSION);
      if (lastSeen !== currentVersionName) {
        // Show a brief notification to the user about what's new.
        const title = _("Text Clock updated");
        const body = _(
          "Text Clock was updated to version %s. You can now change the clock color and divider text in Preferences.",
        ).replace("%s", currentVersionName);

        try {
          // Use the shell's global Main.notify if available.
          if (
            (globalThis as any).Main &&
            typeof (globalThis as any).Main.notify === "function"
          ) {
            (globalThis as any).Main.notify(title, body);
          } else {
            // Fallback to logging if notifications aren't available in this
            // runtime (e.g. during build-time tests).
            logInfo(`${title}: ${body}`);
          }
        } catch (notifyErr) {
          logInfo(`Update notification failed: ${String(notifyErr)}`);
        }

        // Persist the current version so we don't spam the user on subsequent
        // enable cycles.
        try {
          this.#settings.set_string(
            SETTINGS.LAST_SEEN_VERSION,
            currentVersionName,
          );
        } catch (setErr) {
          logWarn(`Failed to persist last-seen-version: ${String(setErr)}`);
        }
      }
    } catch (err) {
      logWarn(`Error checking extension update: ${String(err)}`);
    }
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
    this.#dateMenu = panel.statusArea.dateMenu as IDateMenuButton;
    if (!this.#dateMenu) {
      logInfo(`dateMenu not found on panel.statusArea`);
      return;
    }

    const { _clock, _clockDisplay } = this.#dateMenu as any;
    this.#clock = _clock;
    this.#clockDisplay = _clockDisplay;
  }

  // Place the clock label in the top box
  #placeClockLabel() {
    this.#translatePack = TRANSLATE_PACK();

    // Create the top box
    this.#topBox = new St.BoxLayout({
      style_class: CLOCK_STYLE_CLASS_NAME,
    });

    // Create the clock label and add it to the top box
    const dividerPreset = this.#settings!.get_enum(SETTINGS.DIVIDER_PRESET);
    const customDividerText = this.#settings!.get_string(
      SETTINGS.CUSTOM_DIVIDER_TEXT,
    );
    const dividerText = getDividerText(dividerPreset, customDividerText);
    this.#clockLabel = new TextClockLabel({
      translatePack: this.#translatePack,
      showDate: this.#settings!.get_boolean(SETTINGS.SHOW_DATE),
      showWeekday: this.#settings!.get_boolean(SETTINGS.SHOW_WEEKDAY),
      timeFormat: this.#settings!.get_string(SETTINGS.TIME_FORMAT),
      dividerText: dividerText,
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

    // Insert the top box into the clock display box.
    const clockDisplayBox = this.#findClockDisplayBox();
    clockDisplayBox.add_child(this.#topBox);

    // Remove the style class and hide the original clock display so our
    // text clock is visible in its place.
    this.#clockDisplay!.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
    this.#clockDisplay!.set_width(0);
    (this.#clockDisplay as any).hide();
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

    this.#settings.bind(
      SETTINGS.SHOW_DATE,
      this.#clockLabel,
      CLOCK_LABEL_PROPERTIES.SHOW_DATE,
      Gio.SettingsBindFlags.DEFAULT,
    );

    this.#settings?.connect("changed::fuzziness", () => {
      const fuzzIndex = this.#settings!.get_enum(SETTINGS.FUZZINESS);
      (this.#clockLabel as any).fuzzyMinutes =
        fuzzinessFromEnumIndex(fuzzIndex);
    });

    this.#settings?.connect("changed::time-format", () => {
      const tf = this.#settings?.get_string(SETTINGS.TIME_FORMAT);
      if (tf) {
        (this.#clockLabel as any).timeFormat = tf;
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
    this.#settings.connect("changed::divider-color", () => this.#applyStyles());
    this.#settings.connect("changed::divider-preset", () =>
      this.#applyStyles(),
    );
    this.#settings.connect("changed::custom-divider-text", () =>
      this.#applyStyles(),
    );
  }

  // Apply styles to the clock label
  #applyStyles() {
    if (!this.#clockLabel) return;
    this.#clockLabel.setClockColor(this.#settings!.get_string("clock-color"));
    this.#clockLabel.setDateColor(this.#settings!.get_string("date-color"));
    this.#clockLabel.setDividerColor(
      this.#settings!.get_string("divider-color"),
    );
    const dividerPreset = this.#settings!.get_enum(SETTINGS.DIVIDER_PRESET);
    const customDividerText = this.#settings!.get_string(
      SETTINGS.CUSTOM_DIVIDER_TEXT,
    );
    const dividerText = getDividerText(dividerPreset, customDividerText);
    this.#clockLabel.setDividerText(dividerText);
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
    (this.#clockDisplay as any).show();
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
