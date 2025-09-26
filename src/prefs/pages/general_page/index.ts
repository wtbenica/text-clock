import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import {
  addComboRow,
  addSwitchRow,
  addEntryRowBinding,
} from "../../ui/rows.js";
import { prefsGettext } from "../../../utils/gettext/index.js";
import SettingsKey from "../../../models/settings_keys.js";
import { PrefItems } from "../../../constants/index.js";

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
  const showDateSwitchInfo = {
    title: prefsGettext._(PrefItems.SHOW_DATE.title),
    subtitle: prefsGettext._(PrefItems.SHOW_DATE.subtitle),
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
  const showWeekdaySwitchInfo = {
    title: prefsGettext._(PrefItems.SHOW_WEEKDAY.title),
    subtitle: prefsGettext._(PrefItems.SHOW_WEEKDAY.subtitle),
    sensitive: settings!.get_boolean(SettingsKey.SHOW_DATE),
  };
  return addSwitchRow(
    group,
    showWeekdaySwitchInfo,
    settings,
    SettingsKey.SHOW_WEEKDAY,
    [{ settingKey: SettingsKey.SHOW_DATE, property: "sensitive" }],
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
  const fuzzinessComboInfo = {
    title: prefsGettext._(PrefItems.FUZZINESS.title),
    subtitle: prefsGettext._(PrefItems.FUZZINESS.subtitle),
    model: new Gtk.StringList({ strings: ["1", "5", "10", "15"] }),
    selected: settings!.get_enum(SettingsKey.FUZZINESS),
  };

  return addComboRow(
    group,
    settings,
    SettingsKey.FUZZINESS,
    fuzzinessComboInfo,
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
  const presetInfo = {
    title: prefsGettext._("Divider Preset"),
    subtitle: prefsGettext._("Choose a preset divider or select custom"),
    model: new Gtk.StringList({ strings: ["|", "•", "‖", "—", "Custom"] }),
    selected: settings!.get_enum(SettingsKey.DIVIDER_PRESET),
  };

  const presetRow = addComboRow(
    group,
    settings,
    SettingsKey.DIVIDER_PRESET,
    presetInfo,
  );

  const customEntryRow = new Adw.EntryRow({
    title: prefsGettext._("Custom Divider Text"),
    text: settings.get_string(SettingsKey.CUSTOM_DIVIDER_TEXT),
  });
  group.add(customEntryRow);

  const updateCustomEntryVisibility = () => {
    const selectedPreset = presetRow.selected;
    const isCustom = selectedPreset === 4;
    customEntryRow.visible = isCustom;
  };

  updateCustomEntryVisibility();

  // addComboRow already handles the settings update; just observe for UI changes
  presetRow.connect("notify::selected", () => updateCustomEntryVisibility());

  addEntryRowBinding(settings, SettingsKey.CUSTOM_DIVIDER_TEXT, customEntryRow);
}
