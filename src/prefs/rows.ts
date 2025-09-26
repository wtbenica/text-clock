import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../utils/gettext/index.js";
import { logErr } from "../utils/error_utils.js";

/**
 * Create and add an Adw.ComboRow to a group and bind selection to settings.
 *
 * @param group - Preferences group to add the combo to
 * @param settings - Gio.Settings used to persist the selection
 * @param settingKey - the GSettings key (enum) to write on selection
 * @param props - constructor props for the ComboRow (title, model, selected)
 * @returns Adw.ComboRow - the created combo row
 */
export function addComboRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  settingKey: string,
  props: Partial<Adw.ComboRow.ConstructorProps>,
): Adw.ComboRow {
  const row = new Adw.ComboRow(props);
  group.add(row);
  try {
    row.connect("notify::selected", (widget: Adw.ComboRow) => {
      settings!.set_enum(settingKey, widget.selected);
    });
  } catch (error: any) {
    logErr(error, `Error binding settings for ${props.title}:`);
  }
  return row;
}

/**
 * Bind a Gio.Settings key to a property on an ActionRow-like widget.
 *
 * @param widget - widget that exposes the property to bind
 * @param settings - Gio.Settings instance
 * @param settingKey - the key to bind
 * @param property - the widget property name
 */
export function bindSettingsToProperty(
  widget: Adw.ActionRow,
  settings: Gio.Settings,
  settingKey: string,
  property: string,
) {
  try {
    settings!.bind(settingKey, widget, property, Gio.SettingsBindFlags.DEFAULT);
  } catch (error: any) {
    logErr(
      error,
      `${prefsGettext._("Error binding settings for")} ${widget.title}`,
    );
  }
}

/**
 * Create and add an Adw.SwitchRow to a group, bind its active property to a
 * GSettings key, and optionally bind extra dependent settings to properties.
 *
 * @param group - Preferences group
 * @param props - constructor props for the SwitchRow
 * @param settings - Gio.Settings instance
 * @param settingKey - key bound to the active property
 * @param settingBindings - extra bindings of other keys to widget properties
 * @returns Adw.SwitchRow
 */
export function addSwitchRow(
  group: Adw.PreferencesGroup,
  props: Partial<Adw.SwitchRow.ConstructorProps>,
  settings: Gio.Settings,
  settingKey: string,
  settingBindings?: { settingKey: string; property: string }[],
): Adw.SwitchRow {
  const row = new Adw.SwitchRow(props);
  group.add(row);
  bindSettingsToProperty(row, settings, settingKey, "active");
  settingBindings?.forEach((binding) => {
    bindSettingsToProperty(row, settings, binding.settingKey, binding.property);
  });
  return row;
}

/**
 * Bind a string GSettings key to an Adw.EntryRow's text property.
 *
 * @param settings - Gio.Settings instance
 * @param key - settings key to bind
 * @param entryRow - the Adw.EntryRow to bind to
 */
export function addEntryRowBinding(
  settings: Gio.Settings,
  key: string,
  entryRow: Adw.EntryRow,
) {
  settings.bind(key, entryRow, "text", Gio.SettingsBindFlags.DEFAULT);
}
