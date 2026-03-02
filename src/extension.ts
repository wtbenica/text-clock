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

import SettingsKey from "./models/settings_keys";
import { NotificationService } from "./services/notification_service.js";
import { SettingsManager } from "./services/settings_manager.js";
import { StyleService } from "./services/style_service.js";
import SystemSettingsMonitor from "./services/system_settings_monitor.js";
import {
  TextClockLabel,
  CLOCK_LABEL_PROPERTIES,
} from "./presentation/widgets/clock_widget.js";
import { logErr, logWarn } from "./utils/error_utils.js";
import {
  extensionGettext,
  initExtensionGettext,
} from "./utils/gettext/gettext_utils_ext.js";
import { fuzzinessFromEnumIndex } from "./utils/parse_utils.js";
import { LocalizedStrings } from "./models/localized_strings.js";
import { CustomMessage } from "./models/custom_message.js";
import { createTranslatePack } from "./utils/translate/translate_pack_utils.js";
import { maybeShowUpdateNotification } from "./utils/update_notification_utils.js";

const CLOCK_STYLE_CLASS_NAME = "clock";

/**
 * Replaces the GNOME Shell clock with text-based time display.
 *
 * Shows time as phrases like "five past noon" instead of "12:05".
 * Supports multiple formats, fuzziness levels, optional date/weekday,
 * and custom colors including accent color integration.
 */
export default class TextClock extends Extension {
  #settings?: Gio.Settings;
  #settingsManager?: SettingsManager;
  #styleService?: StyleService;
  #notificationService?: NotificationService;
  #systemSettingsMonitor?: SystemSettingsMonitor;
  #dateMenu?: IDateMenuButton;
  #clock?: GnomeDesktop.WallClock;
  #clockDisplay?: St.Label;
  #topBox?: St.BoxLayout;
  #clockLabel?: InstanceType<typeof TextClockLabel>;
  #clockBinding?: any;
  #translatePack?: LocalizedStrings;

  /**
   * Called by GNOME Shell when the extension activates.
   *
   * Sets up services, creates the clock widget, and binds settings.
   */
  enable() {
    initExtensionGettext(_, ngettext, pgettext);

    this.#initServices();

    maybeShowUpdateNotification({
      settingsManager: this.#settingsManager,
      notificationService: this.#notificationService,
      metadata: this.metadata,
      openPreferences: () => {
        try {
          (this as any).openPreferences();
        } catch (error) {
          logWarn(`Failed to open extension preferences: ${error}`);
        }
      },
    });

    this.#retrieveDateMenu();
    this.#placeClockLabel();
    this.#bindSettingsToClockLabel();
  }

  /**
   * Called by GNOME Shell when the extension deactivates.
   *
   * Restores the original clock and cleans up resources.
   */
  disable() {
    this.#restoreClockDisplay();
    this.#cleanup();
  }

  /** Initialize services: settings, styling, notifications, and system monitors. */
  #initServices() {
    this.#settings = (this as any).getSettings();

    this.#settingsManager = new SettingsManager(this.#settings!);
    this.#styleService = new StyleService(this.#settings!);
    this.#notificationService = new NotificationService("Text Clock");
    this.#systemSettingsMonitor = new SystemSettingsMonitor(this.#settings!);

    try {
      this.#systemSettingsMonitor?.start();
    } catch (e) {
      logWarn(`Failed to start SystemSettingsMonitor: ${e}`);
    }
  }

  /** Reset all class properties to undefined. */
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
    this.#clockBinding = undefined;
    this.#translatePack = undefined;
  }

  #retrieveDateMenu() {
    this.#dateMenu = panel.statusArea.dateMenu as IDateMenuButton;
    if (!this.#dateMenu) {
      return;
    }

    const { _clock, _clockDisplay } = this.#dateMenu as any;
    this.#clock = _clock;
    this.#clockDisplay = _clockDisplay;
  }

  #placeClockLabel() {
    this.#translatePack = createTranslatePack(extensionGettext);

    const clockDisplayBox = this.#findClockDisplayBox();

    // Remove any existing TextClock top box to avoid duplicates
    const existingClockBox = clockDisplayBox
      .get_children()
      .find(
        (child: Clutter.Actor) =>
          child instanceof St.BoxLayout &&
          child.has_style_class_name(CLOCK_STYLE_CLASS_NAME),
      );
    if (existingClockBox) {
      existingClockBox.destroy();
    }

    this.#topBox = new St.BoxLayout({
      style_class: CLOCK_STYLE_CLASS_NAME,
    });

    const currentStyles = this.#styleService!.getCurrentStyles();
    this.#clockLabel = new TextClockLabel({
      translatePack: this.#translatePack,
      showDate: this.#settingsManager!.getBoolean(SettingsKey.SHOW_DATE),
      showWeekday: this.#settingsManager!.getBoolean(SettingsKey.SHOW_WEEKDAY),
      timeFormat: this.#settingsManager!.getString(SettingsKey.TIME_FORMAT),
      dividerText: currentStyles.dividerText || " | ",
    });

    const fuzzValue = this.#settingsManager!.getFuzziness();
    (this.#clockLabel as any).fuzzyMinutes = fuzzValue;
    this.#topBox!.add_child(this.#clockLabel as any);

    this.#applyStyles();

    clockDisplayBox.add_child(this.#topBox);

    this.#clockDisplay!.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
    this.#clockDisplay!.set_width(0);
    (this.#clockDisplay as any).hide();
  }

  #bindSettingsToClockLabel() {
    if (!this.#settingsManager || !this.#clockLabel) {
      logErr("Required services or clock label not available for binding");
      return;
    }

    (this.#clockLabel as any).showDate = this.#settingsManager.getBoolean(
      SettingsKey.SHOW_DATE,
    );
    (this.#clockLabel as any).showWeekday = this.#settingsManager.getBoolean(
      SettingsKey.SHOW_WEEKDAY,
    );

    this.#settingsManager.subscribe(SettingsKey.SHOW_DATE, () => {
      (this.#clockLabel as any).showDate = this.#settingsManager!.getBoolean(
        SettingsKey.SHOW_DATE,
      );
    });
    this.#settingsManager.subscribe(SettingsKey.SHOW_WEEKDAY, () => {
      (this.#clockLabel as any).showWeekday = this.#settingsManager!.getBoolean(
        SettingsKey.SHOW_WEEKDAY,
      );
    });

    // Bind wall clock to clock label - store the binding for cleanup
    this.#clockBinding = (this.#clock as any).bind_property(
      "clock",
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
      GObject.BindingFlags.DEFAULT,
    );

    // Subscribe to fuzziness changes
    this.#settingsManager.subscribe(SettingsKey.FUZZINESS, () => {
      const enumIndex = this.#settingsManager!.getEnum(SettingsKey.FUZZINESS);
      const fuzzValue = fuzzinessFromEnumIndex(enumIndex);
      this.#clockLabel!.fuzzyMinutes = fuzzValue;
    });

    // Subscribe to time format changes
    this.#settingsManager.subscribe(SettingsKey.TIME_FORMAT, () => {
      const timeFormat = this.#settingsManager!.getString(
        SettingsKey.TIME_FORMAT,
      ) as any;
      if (timeFormat) {
        this.#clockLabel!.timeFormat = timeFormat;
      }
    });

    this.#styleService!.registerTarget(this.#clockLabel!);

    // Initialize custom messages in the clock label and subscribe for changes
    try {
      const raw = this.#settings!.get_strv(SettingsKey.CUSTOM_DATE_MESSAGES);
      const messages = raw
        .map((s: string) => {
          try {
            return new CustomMessage(JSON.parse(s));
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as CustomMessage[];
      if (messages.length && this.#clockLabel) this.#clockLabel.setCustomMessages(messages);
    } catch (e) {
      // ignore
    }

    try {
      this.#settingsManager.subscribe(SettingsKey.CUSTOM_DATE_MESSAGES, () => {
        try {
          const raw = this.#settings!.get_strv(SettingsKey.CUSTOM_DATE_MESSAGES);
          const messages = raw
            .map((s: string) => {
              try {
                return new CustomMessage(JSON.parse(s));
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean) as CustomMessage[];
          if (this.#clockLabel) this.#clockLabel.setCustomMessages(messages);
        } catch (e) {
          logWarn(`Failed to update custom messages: ${e}`);
        }
      });
    } catch (e) {
      // ignore subscribe errors
    }
  }

  #applyStyles() {
    if (!this.#clockLabel || !this.#styleService) return;
    this.#styleService.applyStyles(this.#clockLabel);
  }

  #cleanup() {
    // Destroy services
    if (this.#styleService) this.#styleService.destroy();
    if (this.#settingsManager) this.#settingsManager.destroy();
    if (this.#notificationService) this.#notificationService.destroy();
    if (this.#systemSettingsMonitor) this.#systemSettingsMonitor.stop();

    // Destroy UI components
    if (this.#clockBinding) {
      this.#clockBinding.unbind();
      this.#clockBinding = undefined;
    }

    if (this.#clockLabel) (this.#clockLabel as any).destroy();
    if (this.#topBox) this.#topBox.destroy();

    this.#resetProperties();
  }

  #restoreClockDisplay() {
    if (!this.#clockDisplay) {
      return;
    }

    this.#clockDisplay.add_style_class_name(CLOCK_STYLE_CLASS_NAME);
    this.#clockDisplay.set_width(-1);
    this.#clockDisplay.show();
  }

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

    throw new Error(_("Could not find clock display box"));
  }
}

/** Type-safe interface for GNOME Shell's date menu button. */
interface IDateMenuButton extends DateMenuButton {
  _clock: GnomeDesktop.WallClock;
  _clockDisplay: St.Label;
}
