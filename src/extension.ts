/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";
import {
  Extension,
  gettext as _,
  ngettext,
  pgettext,
} from "resource:///org/gnome/shell/extensions/extension.js";
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
import {
  extensionGettext,
  initExtensionGettext,
} from "./utils/gettext/gettext_utils_ext.js";
import { fuzzinessFromEnumIndex } from "./utils/parse_utils.js";
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
  #settingsManager?: SettingsManager;
  #styleService?: StyleService;
  #notificationService?: NotificationService;
  #systemSettingsMonitor?: SystemSettingsMonitor;

  #topBox?: St.BoxLayout;
  #clockLabel?: InstanceType<typeof TextClockLabel>;
  #clockBinding?: any;

  enable() {
    initExtensionGettext(_, ngettext, pgettext);

    // Initialize Services
    const settings = this.getSettings();

    this.#settingsManager = new SettingsManager(settings);
    this.#styleService = new StyleService(settings);
    this.#notificationService = new NotificationService("Text Clock");
    this.#systemSettingsMonitor = new SystemSettingsMonitor(settings);

    this.#systemSettingsMonitor.start();

    // Run notifications check
    maybeShowUpdateNotification({
      settingsManager: this.#settingsManager,
      notificationService: this.#notificationService,
      metadata: this.metadata,
      openPreferences: () => {
        this.openPreferences();
      },
    });

    // Get Top Bar parts
    const dateMenu = panel.statusArea.dateMenu as any;
    if (!dateMenu) return;

    const { _clock, _clockDisplay } = dateMenu;
    const clockDisplayBox = this.#findClockDisplayBox(dateMenu);

    // Create clock and add to panel
    this.#topBox = new St.BoxLayout({ style_class: CLOCK_STYLE_CLASS_NAME });

    const currentStyles = this.#styleService.getCurrentStyles();

    this.#clockLabel = new TextClockLabel({
      translatePack: createTranslatePack(extensionGettext),
      showDate: this.#settingsManager.getBoolean(SettingsKey.SHOW_DATE),
      showWeekday: this.#settingsManager.getBoolean(SettingsKey.SHOW_WEEKDAY),
      timeFormat: this.#settingsManager.getString(SettingsKey.TIME_FORMAT),
      dividerText: currentStyles.dividerText || " | ",
    });

    this.#clockLabel.fuzzyMinutes = this.#settingsManager.getFuzziness();

    this.#topBox.add_child(this.#clockLabel as any);
    clockDisplayBox.add_child(this.#topBox);

    // Apply styling and bindings
    this.#styleService.applyStyles(this.#clockLabel);
    this.#styleService.registerTarget(this.#clockLabel);
    this.#bindSettings(_clock);

    // Hide original clock
    if (_clockDisplay) {
      _clockDisplay.remove_style_class_name(CLOCK_STYLE_CLASS_NAME);
      _clockDisplay.set_width(0);
      _clockDisplay.hide();
    }
  }

  #bindSettings(clockBackend: any) {
    this.#clockBinding = clockBackend.bind_property(
      "clock",
      this.#clockLabel as any,
      CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
      GObject.BindingFlags.DEFAULT,
    );

    this.#settingsManager!.subscribe(SettingsKey.SHOW_DATE, () => {
      this.#clockLabel!.showDate = this.#settingsManager!.getBoolean(
        SettingsKey.SHOW_DATE,
      );
    });
    this.#settingsManager!.subscribe(SettingsKey.SHOW_WEEKDAY, () => {
      this.#clockLabel!.showWeekday = this.#settingsManager!.getBoolean(
        SettingsKey.SHOW_WEEKDAY,
      );
    });
    this.#settingsManager!.subscribe(SettingsKey.FUZZINESS, () => {
      const enumIndex = this.#settingsManager!.getEnum(SettingsKey.FUZZINESS);
      this.#clockLabel!.fuzzyMinutes = fuzzinessFromEnumIndex(enumIndex);
    });
    this.#settingsManager!.subscribe(SettingsKey.TIME_FORMAT, () => {
      this.#clockLabel!.timeFormat = this.#settingsManager!.getString(
        SettingsKey.TIME_FORMAT,
      ) as any;
    });
  }

  disable() {
    this.#styleService?.destroy();
    this.#styleService = undefined;

    this.#settingsManager?.destroy();
    this.#settingsManager = undefined;

    this.#notificationService?.destroy();
    this.#notificationService = undefined;

    this.#systemSettingsMonitor?.stop();
    this.#systemSettingsMonitor = undefined;

    this.#topBox?.destroy();
    this.#topBox = undefined;

    this.#clockLabel?.destroy();
    this.#clockLabel = undefined;

    this.#clockBinding?.unbind();
    this.#clockBinding = undefined;

    // Make clock display visible again
    const dateMenu = panel.statusArea.dateMenu as any;
    if (dateMenu && dateMenu._clockDisplay) {
      dateMenu._clockDisplay.add_style_class_name(CLOCK_STYLE_CLASS_NAME);
      dateMenu._clockDisplay.set_width(-1);
      dateMenu._clockDisplay.show();
    }
  }

  #findClockDisplayBox(dateMenu: any): St.BoxLayout {
    const children = dateMenu?.get_children ? dateMenu.get_children() : [];
    const box = children.find(
      (child: Clutter.Actor) =>
        child instanceof St.BoxLayout &&
        child.has_style_class_name("clock-display-box"),
    );

    if (!box) throw new Error(_("Could not find clock display box"));
    return box as St.BoxLayout;
  }
}
