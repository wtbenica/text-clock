import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import { StyleService } from "../services/style_service.js";
import { prefsGettext } from "../utils/gettext/index.js";
import { PrefItems } from "../constants/index.js";
import SettingsKey from "../models/settings_keys.js";
import {
  addClockColorRow,
  addDateColorRow,
  addDividerColorRow,
} from "./color_controls.js";
import { logErr, logWarn } from "../utils/error_utils.js";

/**
 * Add the color mode selection row and related color rows to a group.
 *
 * The color mode row controls whether the extension uses the system default
 * colors, the system accent color, or custom colors. This function also
 * creates the color rows (time/date/divider) and wires visibility and
 * accent-color change listeners.
 *
 * @param group - Preferences group to which color controls will be added
 * @param settings - Gio.Settings instance used for binding values
 * @param supportsAccentColor - whether the running shell supports accent color
 */
export function addColorModeRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  supportsAccentColor: boolean = true,
): void {
  const modelStrings = ["Default"];
  if (supportsAccentColor) modelStrings.push("Accent Color");
  modelStrings.push("Custom Colors");

  let currentSelected = settings.get_enum(SettingsKey.COLOR_MODE);
  if (!supportsAccentColor && currentSelected === 1) {
    currentSelected = 0;
    settings.set_enum(SettingsKey.COLOR_MODE, 0);
  } else if (!supportsAccentColor && currentSelected === 2) {
    currentSelected = 1;
  }

  const colorModeRow = new Adw.ComboRow({
    title: (prefsGettext as any)(PrefItems.COLOR_MODE.title),
    subtitle: (prefsGettext as any)(PrefItems.COLOR_MODE.subtitle),
    model: new Gtk.StringList({ strings: modelStrings }),
    selected: currentSelected,
  });
  group.add(colorModeRow);

  const styleSvc = new StyleService(settings);
  const clockColorRow = addClockColorRow(group, settings, styleSvc);
  const dateColorRow = addDateColorRow(group, settings, styleSvc);
  const dividerColorRow = addDividerColorRow(group, settings, styleSvc);

  const clockUpdater = clockColorRow
    ? (clockColorRow as any)._updateColorPicker
    : null;
  const dividerUpdater = dividerColorRow
    ? (dividerColorRow as any)._updateColorPicker
    : null;
  const dateUpdater = dateColorRow
    ? (dateColorRow as any)._updateColorPicker
    : null;

  try {
    const ifaceSettings = new Gio.Settings({
      schema: "org.gnome.desktop.interface",
    });
    ifaceSettings.connect("changed::accent-color", () => {
      try {
        if (clockUpdater) clockUpdater();
        if (dividerUpdater) dividerUpdater();
        if (dateUpdater) dateUpdater();
      } catch (colorErr) {
        logErr(colorErr, "Error updating accent color buttons");
      }
    });
  } catch (e) {
    logWarn(`Could not listen for accent-color changes: ${e}`);
  }

  const updateColorRowsVisibility = () => {
    const selectedMode = colorModeRow.selected;
    const isCustom = supportsAccentColor
      ? selectedMode === 2
      : selectedMode === 1;

    clockColorRow.visible = isCustom;
    dividerColorRow.visible = isCustom;
    dateColorRow.visible = isCustom;

    try {
      const showDate = settings.get_boolean(SettingsKey.SHOW_DATE);
      dividerColorRow.visible = isCustom && showDate;
      dateColorRow.visible = isCustom && showDate;
    } catch (e) {
      logErr(e, "Error updating color row visibility");
    }
  };

  updateColorRowsVisibility();

  colorModeRow.connect("notify::selected", () => {
    let settingValue = colorModeRow.selected;
    if (!supportsAccentColor && settingValue === 1) settingValue = 2;
    settings.set_enum(SettingsKey.COLOR_MODE, settingValue);
    updateColorRowsVisibility();
  });

  settings.connect("changed::show-date", () => updateColorRowsVisibility());
}
