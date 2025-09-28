import Adw from "gi://Adw";
import Gio from "gi://Gio";

import { PAGE_ICONS } from "../../../../infrastructure/constants/preferences.js";
import SettingsKey from "../../../../domain/models/settings_keys.js";
import {
  DIVIDER_PRESET_CONFIGS,
  FUZZINESS_CONFIGS,
  TIME_FORMAT_CONFIGS,
} from "../../../../application/services/preference_configs.js";
import { prefsGettext } from "../../../../infrastructure/utils/gettext/gettext_utils_prefs.js";
import {
  createAndAddGroupToPage,
  createAndAddPageToWindow,
} from "../../components/groups.js";
import {
  createBooleanSwitchRow,
  createDependentSwitchRow,
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
  createBooleanSwitchRow(clockSettingsGroup, settings, SettingsKey.SHOW_DATE, {
    title: _("Show Date"),
    subtitle: _("Show the date in the clock"),
  });

  // Dependent switch - sensitivity automatically bound to SHOW_DATE
  createDependentSwitchRow(
    clockSettingsGroup,
    settings,
    SettingsKey.SHOW_WEEKDAY,
    SettingsKey.SHOW_DATE,
    {
      title: _("Show Weekday"),
      subtitle: _("Show the day of the week in the clock"),
    },
  );

  // Simple enum combo - automatically populated from config
  createEnumComboRow(
    clockSettingsGroup,
    settings,
    SettingsKey.TIME_FORMAT,
    TIME_FORMAT_CONFIGS,
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
