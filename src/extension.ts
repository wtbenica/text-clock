/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import GnomeDesktop from "gi://GnomeDesktop";
import GObject from "gi://GObject";
import St from "gi://St";
import {
  Extension,
  gettext as _,
  ngettext,
  pgettext,
} from "resource:///org/gnome/shell/extensions/extension.js";
import { DateMenuButton } from "resource:///org/gnome/shell/ui/dateMenu.js";
import { panel } from "resource:///org/gnome/shell/ui/main.js";

import { Errors } from "./infrastructure/constants/index.js";
import SettingsKey from "./domain/models/settings_keys.js";
import { NotificationService } from "./application/services/notification_service.js";
import { SettingsManager } from "./application/services/settings_manager.js";
import { StyleService } from "./application/services/style_service.js";
import { CLOCK_LABEL_PROPERTIES, ITextClock } from "./domain/types/ui.js";
import { TextClockLabel } from "./presentation/widgets/clock_widget.js";
import { logErr, logWarn } from "./infrastructure/utils/error_utils.js";
import {
  extensionGettext,
  initExtensionGettext,
} from "./infrastructure/utils/gettext/gettext_utils_ext.js";
import { fuzzinessFromEnumIndex } from "./infrastructure/utils/parse_utils.js";
import { createTranslatePackGetter } from "./infrastructure/utils/translate/translate_pack_utils.js";
import { WordPack } from "./word_pack.js";

const CLOCK_STYLE_CLASS_NAME = "clock";

// Initialize gettext functions with the real GNOME Shell functions
initExtensionGettext(_, ngettext, pgettext);

/**
 * Translation pack provider for the extension runtime environment.
 *
 * Creates a WordPack with localized strings for time and date formatting
 * using the extension's gettext context. This provides access to translated
 * text throughout the extension's runtime code.
 *
 * @returns Function that creates a WordPack with current locale translations
 */
export const TRANSLATE_PACK = createTranslatePackGetter(extensionGettext);

/**
 * Main Text Clock extension class for GNOME Shell.
 *
 * This extension replaces GNOME Shell's default digital clock with a textual
 * representation of the time, displaying phrases like "five past noon" instead
 * of "12:05". It integrates seamlessly with the GNOME Shell top bar and
 * provides comprehensive customization options.
 *
 * Key features:
 * - Textual time display with multiple formats and fuzziness levels
 * - Optional date and weekday display
 * - Comprehensive color customization with accent color integration
 * - Live system accent color monitoring
 * - Automatic preference migration and update notifications
 * - Clean integration with GNOME Shell's UI and theming
 *
 * The extension manages multiple services:
 * - SettingsManager: Reactive settings handling with type safety
 * - StyleService: Color and appearance management with live updates
 * - NotificationService: User notifications for updates and errors
 *
 * Architecture follows GNOME Shell extension patterns with proper resource
 * management, signal handling, and cleanup to prevent memory leaks.
 *
 * @example
 * ```typescript
 * // Extension lifecycle is managed by GNOME Shell
 * const extension = new TextClock(metadata);
 * extension.enable();  // Called by GNOME Shell when extension activates
 * extension.disable(); // Called by GNOME Shell when extension deactivates
 * ```
 */
export default class TextClock extends Extension {
  #settings?: Gio.Settings;
  #settingsManager?: SettingsManager;
  #styleService?: StyleService;
  #notificationService?: NotificationService;
  #dateMenu?: IDateMenuButton;
  #clock?: GnomeDesktop.WallClock;
  #clockDisplay?: St.Label;
  #topBox?: St.BoxLayout;
  #clockLabel?: ITextClock;
  #translatePack?: WordPack;

  /**
   * Enable the extension - called by GNOME Shell when extension activates.
   *
   * Performs complete extension initialization including service setup,
   * UI integration, and settings binding. This method must complete successfully
   * for the extension to function properly.
   *
   * Initialization sequence:
   * 1. Initialize core services (settings, styling, notifications)
   * 2. Show update notifications if needed
   * 3. Integrate with GNOME Shell's date menu button
   * 4. Create and place the text clock widget
   * 5. Bind settings for reactive updates
   */
  enable() {
    this.#initServices();
    this.#maybeShowUpdateNotification();
    this.#retrieveDateMenu();
    this.#placeClockLabel();
    this.#bindSettingsToClockLabel();
  }

  /**
   * Disable the extension - called by GNOME Shell when extension deactivates.
   *
   * Performs complete cleanup to restore GNOME Shell's original state and
   * prevent memory leaks. Essential for proper extension lifecycle management
   * in the GNOME Shell environment.
   *
   * Cleanup sequence:
   * 1. Restore original clock display in the top bar
   * 2. Clean up all services and disconnect signal handlers
   * 3. Clear references to prevent memory leaks
   */
  disable() {
    this.#restoreClockDisplay();
    this.#cleanup();
  }

  /**
   * Initialize all core services required by the extension.
   *
   * Sets up the service layer including settings management, styling system,
   * and notification handling. Services are initialized in dependency order
   * to ensure proper functionality.
   *
   * @private
   */
  #initServices() {
    // Initialize settings first
    this.#settings = (this as any).getSettings();

    // Initialize services directly
    this.#settingsManager = new SettingsManager(this.#settings!);
    this.#styleService = new StyleService(this.#settings!);
    this.#notificationService = new NotificationService("Text Clock");
  }

  // When the extension is enabled check whether we have a stored last-seen
  // version and, if it differs from the current metadata version-name,
  // show a short notification and persist the new version-name.
  #maybeShowUpdateNotification() {
    if (!this.#settingsManager || !this.#notificationService) return;

    // Extension metadata is provided by the base Extension class; access
    // via (this as any).metadata which mirrors metadata.json at build time.
    const meta: any = this.metadata || {};
    const currentVersionName: string =
      meta["version-name"] || String(meta.version || "");

    if (!currentVersionName) {
      logWarn("No version-name found in metadata, skipping notification");
      return;
    }

    const lastSeen = this.#settingsManager.getString(
      SettingsKey.LAST_SEEN_VERSION,
    );

    if (lastSeen !== currentVersionName) {
      // Show update notification using the service
      this.#notificationService.showUpdateNotification(currentVersionName, () =>
        (this as any).openPreferences(),
      );

      // Persist the current version
      this.#settingsManager.setString(
        SettingsKey.LAST_SEEN_VERSION,
        currentVersionName,
      );
    }
  }

  // Initialize class properties to undefined
  #resetProperties() {
    this.#settings = undefined;
    this.#settingsManager = undefined;
    this.#styleService = undefined;
    this.#notificationService = undefined;
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
    const currentStyles = this.#styleService!.getCurrentStyles();
    this.#clockLabel = new TextClockLabel({
      translatePack: this.#translatePack,
      showDate: this.#settingsManager!.getBoolean(SettingsKey.SHOW_DATE),
      showWeekday: this.#settingsManager!.getBoolean(SettingsKey.SHOW_WEEKDAY),
      timeFormat: this.#settingsManager!.getString(SettingsKey.TIME_FORMAT),
      dividerText: currentStyles.dividerText || " | ",
    });

    // Set initial fuzziness
    const fuzzValue = this.#settingsManager!.getFuzziness();
    (this.#clockLabel as any).fuzzyMinutes = fuzzValue;
    this.#topBox!.add_child(this.#clockLabel as any);

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
    if (!this.#settingsManager || !this.#clockLabel) {
      logErr("Required services or clock label not available for binding");
      return;
    }

    // Bind basic properties using settings manager
    this.#settingsManager.bindProperty(
      SettingsKey.SHOW_DATE,
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.SHOW_DATE,
    );

    this.#settingsManager.bindProperty(
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
    this.#settingsManager.subscribe(SettingsKey.FUZZINESS, () => {
      // For enum settings, ensure we get the numeric index
      const enumIndex = this.#settingsManager!.getEnum(
        SettingsKey.FUZZINESS,
        1,
      );
      const fuzzValue = fuzzinessFromEnumIndex(enumIndex);
      this.#clockLabel!.fuzzyMinutes = fuzzValue;
    });

    // Subscribe to time format changes
    this.#settingsManager.subscribe(
      SettingsKey.TIME_FORMAT,
      (newValue: any) => {
        if (newValue) {
          this.#clockLabel!.timeFormat = newValue;
        }
      },
    );

    // Register the clock label with the style service for automatic updates
    this.#styleService!.registerTarget(this.#clockLabel!);
  }

  // Apply styles to the clock label
  #applyStyles() {
    if (!this.#clockLabel || !this.#styleService) return;
    this.#styleService.applyStyles(this.#clockLabel);
  }

  // Destroys created objects and sets properties to undefined
  #cleanup() {
    // Destroy services
    if (this.#styleService) this.#styleService.destroy();
    if (this.#settingsManager) this.#settingsManager.destroy();
    if (this.#notificationService) this.#notificationService.destroy();

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
