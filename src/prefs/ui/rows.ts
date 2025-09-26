import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { logErr } from "../../utils/error_utils.js";
import { bindSettingsToProperty } from "../helpers.js";

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

export function addEntryRowBinding(
  settings: Gio.Settings,
  key: string,
  entryRow: Adw.EntryRow,
) {
  settings.bind(key, entryRow, "text", Gio.SettingsBindFlags.DEFAULT);
}
