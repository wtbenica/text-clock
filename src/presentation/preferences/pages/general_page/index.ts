// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gio from "gi://Gio";

import { PAGE_ICONS } from "../../../../constants/preferences.js";
import SettingsKey from "../../../../models/settings_keys";
import {
  DIVIDER_PRESET_CONFIGS,
  FUZZINESS_CONFIGS,
  getTimeFormatConfigsWithSamples,
} from "../../../../services/preference_service.js";
import { prefsGettext } from "../../../../utils/gettext/gettext_utils_prefs.js";
import {
  createAndAddGroupToPage,
  createAndAddPageToWindow,
} from "../../components/groups.js";
import { logWarn } from "../../../../utils/error_utils.js";
import {
  createBooleanSwitchRow,
  createEnumComboRow,
  createPresetWithCustomRow,
} from "../../components/preference_ui_factory.js";

/**
 * Create the General preferences page using the unified configuration system.
 * @param window - Adw.PreferencesWindow instance
 * @param settings - Gio.Settings instance
 * @returns Adw.PreferencesPage the created page
 */
export function createGeneralPage(
  window: Adw.PreferencesWindow,
  settings: Gio.Settings,
) {
  const { _ } = prefsGettext;
  const page = createAndAddPageToWindow(
    window,
    _("General"),
    PAGE_ICONS.GENERAL,
  );

  const clockSettingsGroup = createAndAddGroupToPage(
    page,
    _("Clock Settings"),
    _("Customize the appearance and behavior of the clock"),
  );

  const systemSettings = (() => {
    try {
      return new Gio.Settings({ schema: "org.gnome.desktop.interface" });
    } catch (e) {
      logWarn(`Could not open org.gnome.desktop.interface schema: ${e}`);
      return null;
    }
  })();

  // Track signal connection IDs for cleanup
  const connectionIds: number[] = [];

  // Connect Show Date to system clock setting if available. Otherwise, bind to extension setting as fallback.
  if (systemSettings) {
    createBooleanSwitchRow(
      clockSettingsGroup,
      systemSettings as Gio.Settings,
      "clock-show-date",
      {
        title: _("Show Date"),
        subtitle: _("Show the date in the clock"),
      },
    );

    try {
      const connId = systemSettings.connect("changed::clock-show-date", () => {
        const val = systemSettings.get_boolean("clock-show-date");
        settings.set_boolean(SettingsKey.SHOW_DATE, val);
      });
      connectionIds.push(connId);
    } catch (e) {
      logWarn(
        `Failed to connect to org.gnome.desktop.interface changed::clock-show-date: ${e}`,
      );
    }
  } else {
    createBooleanSwitchRow(
      clockSettingsGroup,
      settings,
      SettingsKey.SHOW_DATE,
      {
        title: _("Show Date"),
        subtitle: _("Show the date in the clock"),
      },
    );
  }

  // Bind Show Weekday to system clock setting if available. Otherwise, bind to extension setting as fallback.
  if (systemSettings) {
    createBooleanSwitchRow(
      clockSettingsGroup,
      systemSettings as Gio.Settings,
      "clock-show-weekday",
      {
        title: _("Show Weekday"),
        subtitle: _("Show the day of the week in the clock"),
      },
    );
    try {
      const connId = systemSettings.connect(
        "changed::clock-show-weekday",
        () => {
          const val = systemSettings.get_boolean("clock-show-weekday");
          settings.set_boolean(SettingsKey.SHOW_WEEKDAY, val);
        },
      );
      connectionIds.push(connId);
    } catch (e) {
      logWarn(
        `Failed to connect to org.gnome.desktop.interface changed::clock-show-weekday: ${e}`,
      );
    }
  } else {
    createBooleanSwitchRow(
      clockSettingsGroup,
      settings,
      SettingsKey.SHOW_WEEKDAY,
      {
        title: _("Show Weekday"),
        subtitle: _("Show the day of the week in the clock"),
      },
    );
  }

  createEnumComboRow(
    clockSettingsGroup,
    settings,
    SettingsKey.TIME_FORMAT,
    getTimeFormatConfigsWithSamples(prefsGettext),
    {
      title: _("Time Format"),
      subtitle: _("Choose the time display format"),
    },
  );

  createEnumComboRow(
    clockSettingsGroup,
    settings,
    SettingsKey.FUZZINESS,
    FUZZINESS_CONFIGS,
    {
      title: _("Fuzziness"),
      subtitle: _("How precise the time displayed should be"),
    },
  );

  createPresetWithCustomRow(
    clockSettingsGroup,
    settings,
    SettingsKey.DIVIDER_PRESET,
    SettingsKey.CUSTOM_DIVIDER_TEXT,
    DIVIDER_PRESET_CONFIGS,
    {
      title: _("Divider Preset"),
      subtitle: _("Choose a preset divider or select custom"),
    },
    {
      title: _("Custom Divider Text"),
    },
  );

  // Disconnect signal handlers when window closes
  if (systemSettings && connectionIds.length > 0) {
    window.connect("close-request", () => {
      connectionIds.forEach((id) => systemSettings.disconnect(id));
    });
  }

  return page;
}
