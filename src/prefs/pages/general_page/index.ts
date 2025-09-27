import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import {
  addComboRow,
  addSwitchRow,
  addEntryRowBinding,
} from "../../ui/rows.js";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";
import SettingsKey from "../../../models/settings_keys.js";
import { DIVIDER_PRESETS } from "../../../constants/prefs.js";
import {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
} from "../../ui/groups.js";
import { PAGE_ICONS } from "../../../constants/prefs.js";
import { addTimeFormatComboRow } from "./formatters.js";

// Index of the custom divider preset in DIVIDER_PRESET.OPTIONS
const CUSTOM_DIVIDER_PRESET_INDEX = 5;

/**
 * Add a switch row that toggles showing the date.
 *
 * @param group - Preferences group to add row to
 * @param settings - Gio.Settings instance used to bind the value
 * @returns Adw.SwitchRow - the created switch row
 */
export function addShowDateSwitchRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
): Adw.SwitchRow {
  const { _ } = prefsGettext;
  const showDateSwitchInfo = {
    title: _("Show Date"),
    subtitle: _("Show the date in the clock"),
  };
  return addSwitchRow(
    group,
    showDateSwitchInfo,
    settings,
    SettingsKey.SHOW_DATE,
  );
}

/**
 * Add a switch row that toggles showing the weekday.
 *
 * The row's sensitivity is bound to the SHOW_DATE setting so it is only
 * editable when the date is shown.
 *
 * @param group - Preferences group
 * @param settings - Gio.Settings instance
 * @returns Adw.SwitchRow - the created switch row
 */
export function addShowWeekdaySwitchRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
): Adw.SwitchRow {
  const { _ } = prefsGettext;
  const showWeekdaySwitchInfo = {
    title: _("Show Weekday"),
    subtitle: _("Show the day of the week in the clock"),
  };
  return addSwitchRow(
    group,
    showWeekdaySwitchInfo,
    settings,
    SettingsKey.SHOW_WEEKDAY,
  );
}

/**
 * Create a combo row for fuzziness selection.
 *
 * The combo presents a small list of fuzziness intervals (in minutes) and
 * binds to the FUZZINESS setting.
 *
 * @param group - Preferences group
 * @param settings - Gio.Settings
 * @returns Adw.ComboRow
 */
export function createFuzzinessComboRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
): Adw.ComboRow {
  const { _ } = prefsGettext;

  const fuzzinessOptions = [_("one"), _("five"), _("ten"), _("fifteen")];

  const fuzzinessComboRowInfo = {
    title: _("Fuzziness"),
    subtitle: _("How precise the time displayed should be"),
    model: new Gtk.StringList({ strings: fuzzinessOptions }),
    selected: settings!.get_enum(SettingsKey.FUZZINESS),
  };

  return addComboRow(
    group,
    settings,
    SettingsKey.FUZZINESS,
    fuzzinessComboRowInfo,
  );
}

/**
 * Add the divider preset combo row and a custom text entry.
 *
 * The function wires visibility of the custom entry based on the selected
 * preset and binds the custom text to the CUSTOM_DIVIDER_TEXT setting.
 *
 * @param group - Preferences group
 * @param settings - Gio.Settings
 */
export function addDividerPresetRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
): void {
  const { _ } = prefsGettext;
  // Translate the divider preset options (except the actual divider symbols)
  const translatedOptions = [...DIVIDER_PRESETS];
  // Only translate "Custom" - keep the actual divider symbols as-is
  translatedOptions[translatedOptions.length - 1] = _("Custom");

  const presetInfo = {
    title: _("Divider Preset"),
    subtitle: _("Choose a preset divider or select custom"),
    model: new Gtk.StringList({ strings: translatedOptions }),
    selected: settings!.get_enum(SettingsKey.DIVIDER_PRESET),
  };

  const presetRow = addComboRow(
    group,
    settings,
    SettingsKey.DIVIDER_PRESET,
    presetInfo,
  );

  const customEntryRow = new Adw.EntryRow({
    title: _("Custom Divider Text"),
    text: settings.get_string(SettingsKey.CUSTOM_DIVIDER_TEXT),
  });
  group.add(customEntryRow);

  const updateCustomEntryVisibility = () => {
    const selectedPreset = presetRow.selected;
    const isCustom = selectedPreset === CUSTOM_DIVIDER_PRESET_INDEX;
    customEntryRow.visible = isCustom;
  };

  updateCustomEntryVisibility();

  // addComboRow already handles the settings update; just observe for UI changes
  presetRow.connect("notify::selected", () => updateCustomEntryVisibility());

  addEntryRowBinding(settings, SettingsKey.CUSTOM_DIVIDER_TEXT, customEntryRow);
}

/**
 * Create the General preferences page and add it to the provided window.
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

  addShowDateSwitchRow(clockSettingsGroup, settings);
  addShowWeekdaySwitchRow(clockSettingsGroup, settings);
  addTimeFormatComboRow(clockSettingsGroup, settings);
  createFuzzinessComboRow(clockSettingsGroup, settings);
  addDividerPresetRow(clockSettingsGroup, settings);

  return page;
}
