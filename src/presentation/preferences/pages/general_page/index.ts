// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gio from "gi://Gio";

import { PAGE_ICONS } from "../../../../constants/preferences.js";
import SettingsKey from "../../../../domain/models/settings_keys.js";
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
 *
 * This demonstrates how the new preference system dramatically simplifies
 * preference page creation by eliminating boilerplate and ensuring consistency.
 *
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

  // Simple boolean switch - automatically bound to settings
  // Bind the Show Date switch to the system clock setting so the user's
  // GNOME Settings choice is reflected here.
  // Create a system settings instance for org.gnome.desktop.interface and
  // bind the widget to its keys. Fall back to extension settings if system
  // schema isn't available.
  const systemSettings = (() => {
    try {
      return new Gio.Settings({ schema: "org.gnome.desktop.interface" });
    } catch (e) {
      logWarn(`Could not open org.gnome.desktop.interface schema: ${e}`);
      return null;
    }
  })();

  if (systemSettings) {
    // Create the UI row backed by system settings
    createBooleanSwitchRow(
      clockSettingsGroup,
      systemSettings as Gio.Settings,
      "clock-show-date",
      {
        title: _("Show Date"),
        subtitle: _("Show the date in the clock"),
      },
    );
    // Also keep the extension key in sync: when the system key changes, copy it
    // into extension settings so runtime reads the extension schema as usual.
    try {
      systemSettings.connect("changed::clock-show-date", () => {
        try {
          const val = systemSettings.get_boolean("clock-show-date");
          settings.set_boolean(SettingsKey.SHOW_DATE, val);
        } catch (e) {
          logWarn(
            `Failed to apply org.gnome.desktop.interface.clock-show-date to extension setting: ${e}`,
          );
        }
      });
    } catch (e) {
      logWarn(
        `Failed to connect to org.gnome.desktop.interface changed::clock-show-date: ${e}`,
      );
    }
  } else {
    // Fall back to binding extension settings if system schema isn't present
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

  // Bind Show Weekday to system clock setting as well. GNOME treats weekday
  // independently of date, so we create an independent binding here.
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
      systemSettings.connect("changed::clock-show-weekday", () => {
        try {
          const val = systemSettings.get_boolean("clock-show-weekday");
          settings.set_boolean(SettingsKey.SHOW_WEEKDAY, val);
        } catch (e) {
          logWarn(
            `Failed to apply org.gnome.desktop.interface.clock-show-weekday to extension setting: ${e}`,
          );
        }
      });
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

  // Simple enum combo - automatically populated from config with sample times
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

  // Simple enum combo with translations applied automatically
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

  // Preset with custom entry - automatically handles visibility and binding
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

  return page;
}
