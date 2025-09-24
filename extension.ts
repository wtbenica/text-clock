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

import { TextClockLabel } from "./ui/clock_label.js";
import { CLOCK_LABEL_PROPERTIES } from "./ui/interfaces.js";
import { WordPack } from "./word_pack.js";
import { Errors } from "./constants/index.js";
import SettingsKey from "./models/settings-keys";
import { logErr, logWarn, logInfo } from "./utils/error-utils.js";
import { fuzzinessFromEnumIndex } from "./utils/fuzziness-utils.js";
import { createTranslatePack } from "./utils/translate-pack-utils.js";
import { extensionGettext } from "./utils/gettext-utils-ext.js";
import ServiceContainer from "./services/service_container.js";

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
  #serviceContainer?: ServiceContainer;
  #dateMenu?: IDateMenuButton;
  #clock?: GnomeDesktop.WallClock;
  #clockDisplay?: St.Label;
  #topBox?: St.BoxLayout;
  #clockLabel?: any;
  #translatePack?: WordPack;

  enable() {
    this.#initServices();
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
  // Initialize all services
  #initServices() {
    // Initialize settings first
    this.#settings = (this as any).getSettings();

    // Initialize service container
    this.#serviceContainer = new ServiceContainer(this.#settings as any);

    logInfo("Service container initialized");
  }

  // When the extension is enabled check whether we have a stored last-seen
  // version and, if it differs from the current metadata version-name,
  // show a short notification and persist the new version-name.
  #maybeShowUpdateNotification() {
    try {
      if (!this.#serviceContainer) return;

      // Extension metadata is provided by the base Extension class; access
      // via (this as any).metadata which mirrors metadata.json at build time.
      const meta: any = (this as any).metadata || {};
      const currentVersionName: string =
        meta["version-name"] || String(meta.version || "");

      if (!currentVersionName) {
        logWarn("No version-name found in metadata, skipping notification");
        return;
      }

      const lastSeen = this.#serviceContainer!.settingsManager.getString(
        SettingsKey.LAST_SEEN_VERSION,
      );

      if (lastSeen !== currentVersionName) {
        logInfo(
          `Showing update notification for version ${currentVersionName}`,
        );

        // Show update notification using the service
        this.#serviceContainer.notificationService.showUpdateNotification(
          currentVersionName,
          () => (this as any).openPreferences(),
        );

        // Persist the current version
        this.#serviceContainer.settingsManager.setString(
          SettingsKey.LAST_SEEN_VERSION,
          currentVersionName,
        );
      }
    } catch (err) {
      logWarn(`Error checking extension update: ${String(err)}`);
    }
  }

  // Initialize class properties to undefined
  #resetProperties() {
    this.#settings = undefined;
    this.#serviceContainer = undefined;
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

    // Create the clock label with current settings
    const currentStyles =
      this.#serviceContainer!.styleService.getCurrentStyles();
    this.#clockLabel = new TextClockLabel({
      translatePack: this.#translatePack,
      showDate: this.#serviceContainer!.settingsManager.getBoolean(
        SettingsKey.SHOW_DATE,
      ),
      showWeekday: this.#serviceContainer!.settingsManager.getBoolean(
        SettingsKey.SHOW_WEEKDAY,
      ),
      timeFormat: this.#serviceContainer!.settingsManager.getString(
        SettingsKey.TIME_FORMAT,
      ),
      dividerText: currentStyles.dividerText || " | ",
    });

    // Set initial fuzziness
    const fuzzValue = this.#serviceContainer!.settingsManager.getFuzziness();
    (this.#clockLabel as any).fuzzyMinutes = fuzzValue;
    this.#topBox.add_child(this.#clockLabel! as any);

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
    if (!this.#serviceContainer || !this.#clockLabel) {
      logErr("Required services or clock label not available for binding");
      return;
    }

    // Bind basic properties using settings manager
    this.#serviceContainer.settingsManager.bindProperty(
      SettingsKey.SHOW_DATE,
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.SHOW_DATE,
    );

    this.#serviceContainer.settingsManager.bindProperty(
      SettingsKey.SHOW_WEEKDAY,
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY,
    );

    // Bind clock updates
    this.#clock!.bind_property(
      "clock",
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
      GObject.BindingFlags.DEFAULT,
    );

    // Subscribe to fuzziness changes
    this.#serviceContainer.settingsManager.subscribe(
      SettingsKey.FUZZINESS,
      (newValue) => {
        const fuzzValue = fuzzinessFromEnumIndex(newValue);
        (this.#clockLabel as any).fuzzyMinutes = fuzzValue;
      },
    );

    // Subscribe to time format changes
    this.#serviceContainer.settingsManager.subscribe(
      SettingsKey.TIME_FORMAT,
      (newValue) => {
        if (newValue) {
          (this.#clockLabel as any).timeFormat = newValue;
        }
      },
    );

    // Register the clock label with the style service for automatic updates
    this.#serviceContainer.styleService.registerTarget(this.#clockLabel as any);
  }

  // Apply styles to the clock label
  #applyStyles() {
    if (!this.#clockLabel || !this.#serviceContainer) return;
    this.#serviceContainer.styleService.applyStyles(this.#clockLabel);
  }

  // Destroys created objects and sets properties to undefined
  #cleanup() {
    // Destroy services via container
    if (this.#serviceContainer) this.#serviceContainer.destroy();

    // Destroy UI components
    if (this.#clockLabel) (this.#clockLabel as any).destroy();
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
