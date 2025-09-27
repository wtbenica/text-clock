import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";
import { logErr, logWarn } from "../../../utils/error_utils.js";
import { StyleService } from "../../../services/style_service.js";
import SettingsKey from "../../../models/settings_keys.js";
import { createAndAddPageToWindow } from "../../ui/groups.js";
import { PAGE_ICONS } from "../../../constants/prefs.js";
import { ACCENT_COLOR_STYLE_NAMES } from "../../../constants/index.js";
import {
  addClockColorRow as _addClockColorRow,
  addDateColorRow as _addDateColorRow,
  addDividerColorRow as _addDividerColorRow,
} from "./color_controls.js";

/**
 * Create a compact color control widget used in prefs.
 *
 * See original `color_controls.createColorControlWidget` for details.
 */
export { createColorControlWidget, createColorRow } from "./color_controls.js";

export function addClockColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return _addClockColorRow(group, settings, styleSvc);
}

export function addDateColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return _addDateColorRow(group, settings, styleSvc);
}

export function addDividerColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return _addDividerColorRow(group, settings, styleSvc);
}

/**
 * Add the accent color style selection row to a group.
 */
export function addAccentStyleRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
): Adw.ComboRow {
  const modelStrings = ACCENT_COLOR_STYLE_NAMES.map((name) =>
    prefsGettext._(name),
  );
  const currentSelected = settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE);

  const accentStyleRow = new Adw.ComboRow({
    title: prefsGettext._("Accent Style"),
    subtitle: prefsGettext._("Choose accent color variation"),
    model: new Gtk.StringList({ strings: modelStrings }),
    selected: currentSelected,
  });

  group.add(accentStyleRow);

  accentStyleRow.connect("notify::selected", () => {
    settings.set_enum(SettingsKey.ACCENT_COLOR_STYLE, accentStyleRow.selected);
  });

  return accentStyleRow;
}

/**
 * Add the color mode selection row and related color rows to a group.
 *
 * The color mode row controls whether the extension uses the system default
 * colors, the system accent color, or custom colors. This function also
 * creates the color rows (time/date/divider) and wires visibility and
 * accent-color change listeners.
 */
const COLOR_MODE_DEFAULT = 0;
const COLOR_MODE_ACCENT = 1;
const COLOR_MODE_CUSTOM = 2;

export function addColorModeRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  supportsAccentColor: boolean = true,
): void {
  const modelStrings = [prefsGettext._("Default")];
  if (supportsAccentColor) modelStrings.push(prefsGettext._("Accent Color"));
  modelStrings.push(prefsGettext._("Custom Colors"));

  let currentSelected = settings.get_enum(SettingsKey.COLOR_MODE);
  if (!supportsAccentColor && currentSelected === COLOR_MODE_ACCENT) {
    currentSelected = COLOR_MODE_DEFAULT;
    settings.set_enum(SettingsKey.COLOR_MODE, COLOR_MODE_DEFAULT);
  } else if (!supportsAccentColor && currentSelected === COLOR_MODE_CUSTOM) {
    currentSelected = COLOR_MODE_ACCENT;
  }
  const colorModeRow = new Adw.ComboRow({
    title: prefsGettext._("Color mode"),
    subtitle: prefsGettext._("Choose which color source to use"),
    model: new Gtk.StringList({ strings: modelStrings }),
    selected: currentSelected,
  });
  group.add(colorModeRow);

  const styleSvc = new StyleService(settings);
  const accentStyleRow = addAccentStyleRow(group, settings);
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
    const isAccent = supportsAccentColor && selectedMode === COLOR_MODE_ACCENT;
    const isCustom = supportsAccentColor
      ? selectedMode === COLOR_MODE_CUSTOM
      : selectedMode === COLOR_MODE_ACCENT;

    // Show accent style row only when accent color mode is selected
    accentStyleRow.visible = isAccent;

    // Show custom color rows only when custom colors mode is selected
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
    if (!supportsAccentColor && settingValue === COLOR_MODE_ACCENT)
      settingValue = COLOR_MODE_CUSTOM;
    settings.set_enum(SettingsKey.COLOR_MODE, settingValue);
    updateColorRowsVisibility();
  });

  settings.connect("changed::show-date", () => updateColorRowsVisibility());
}

export default {
  addColorModeRow,
  addAccentStyleRow,
  addClockColorRow,
  addDateColorRow,
  addDividerColorRow,
};

/**
 * Create the Colors preferences page and add it to the provided window.
 *
 * @param window - Adw.PreferencesWindow instance
 * @param settings - Gio.Settings instance
 * @param supportsAccentColor - whether accent color is supported
 * @returns Adw.PreferencesPage the created page
 */
export function createColorsPage(
  window: Adw.PreferencesWindow,
  settings: Gio.Settings,
  supportsAccentColor: boolean,
) {
  const { _ } = prefsGettext;
  const page = createAndAddPageToWindow(window, _("Colors"), PAGE_ICONS.COLORS);

  const colorGroup = new Adw.PreferencesGroup({
    title: _("Clock Colors"),
    description: _("Customize the colors of the clock and date text"),
  });
  page.add(colorGroup);

  addColorModeRow(colorGroup, settings, supportsAccentColor);

  return page;
}
