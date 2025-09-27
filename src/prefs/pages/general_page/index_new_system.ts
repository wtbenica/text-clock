import Gio from "gi://Gio";
import Adw from "gi://Adw";
import {
  createBooleanSwitchRow,
  createDependentSwitchRow,
  createEnumComboRow,
  createPresetWithCustomRow,
} from "../../ui/preference_ui_factory.js";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";
import SettingsKey from "../../../models/settings_keys.js";
import {
  FUZZINESS_CONFIGS,
  DIVIDER_PRESET_CONFIGS,
  TIME_FORMAT_CONFIGS,
} from "../../../services/preference_configs.js";
import {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
} from "../../ui/groups.js";
import { PAGE_ICONS } from "../../../constants/prefs.js";

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
    title: "Show Date",
    subtitle: "Show the date in the clock",
  });

  // Dependent switch - sensitivity automatically bound to SHOW_DATE
  createDependentSwitchRow(
    clockSettingsGroup,
    settings,
    SettingsKey.SHOW_WEEKDAY,
    SettingsKey.SHOW_DATE,
    {
      title: "Show Weekday",
      subtitle: "Show the day of the week in the clock",
    },
  );

  // Simple enum combo - automatically populated from config
  createEnumComboRow(
    clockSettingsGroup,
    settings,
    SettingsKey.TIME_FORMAT,
    TIME_FORMAT_CONFIGS,
    {
      title: "Time Format",
      subtitle: "Choose the time display format",
    },
  );

  // Simple enum combo with translations applied automatically
  createEnumComboRow(
    clockSettingsGroup,
    settings,
    SettingsKey.FUZZINESS,
    FUZZINESS_CONFIGS,
    {
      title: "Fuzziness",
      subtitle: "How precise the time displayed should be",
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
      title: "Divider Preset",
      subtitle: "Choose a preset divider or select custom",
    },
    {
      title: "Custom Divider Text",
    },
  );

  return page;
}

/**
 * This is dramatically simpler than the original implementation:
 *
 * BEFORE (original code):
 * - 120+ lines of manual UI creation
 * - Hardcoded string arrays and indices
 * - Manual visibility management
 * - Repeated binding patterns
 * - Constants scattered across files
 * - No internationalization support for option names
 *
 * AFTER (new system):
 * - ~50 lines of declarative configuration
 * - All data centralized in preference_configs.ts
 * - Automatic UI generation and binding
 * - Full internationalization support with gettext functions
 * - Type-safe configuration
 * - Consistent behavior across all preferences
 *
 * Adding a new preference now requires:
 * 1. Add config to preference_configs.ts with translation functions
 * 2. Add one function call in the page
 *
 * That's it! No schema updates, no manual UI code, no constants to maintain.
 * The translation functions ensure proper i18n support automatically.
 *
 * Translation benefits:
 * - Display names are properly translated: displayName: ({ _ }) => _("Custom")
 * - Symbols stay untranslated: displayName: ({ _ }) => "•"
 * - Descriptions support full translation context
 * - Consistent translation patterns across all preferences
 */
