// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import { PAGE_ICONS } from "../../../../infrastructure/constants/preferences.js";
import SettingsKey from "../../../../domain/models/settings_keys.js";
import { PREFERENCE_CONFIGS } from "../../../../application/services/preference_configs.js";
import { StyleService } from "../../../../application/services/style_service.js";
import {
  logErr,
  logWarn,
} from "../../../../infrastructure/utils/error_utils.js";
import { prefsGettext } from "../../../../infrastructure/utils/gettext/gettext_utils_prefs.js";
import { createAndAddPageToWindow } from "../../components/groups.js";
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
  const allConfigs = PREFERENCE_CONFIGS.ACCENT_STYLE;

  /**
   * Build a grouped model with section headers and mapping to original indices.
   * Headers are marked with -1 to make them non-selectable.
   */
  const buildGroupedModel = () => {
    const strings: string[] = [];
    const mapping: number[] = []; // Maps display index to original config index

    // Monochrome section (first 3 styles: solid, light-variant, dark-variant)
    strings.push(prefsGettext._("Solid"));
    mapping.push(-1); // Header marker

    for (let i = 0; i < 3; i++) {
      const config = allConfigs[i];
      strings.push(`  ${config.displayName(prefsGettext)}`);
      mapping.push(i);
    }

    // Multicolor section (remaining styles: duotone, racing-stripe, etc.)
    strings.push(prefsGettext._("Contrasting"));
    mapping.push(-1); // Header marker

    for (let i = 3; i < allConfigs.length; i++) {
      const config = allConfigs[i];
      strings.push(`  ${config.displayName(prefsGettext)}`);
      mapping.push(i);
    }

    return { strings, mapping };
  };

  const { strings, mapping } = buildGroupedModel();
  const storedIndex = settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE);

  // Find the display index for the currently stored value
  const selectedDisplayIndex = mapping.findIndex(
    (index) => index === storedIndex,
  );

  const comboRow = new Adw.ComboRow({
    title: prefsGettext._("Accent Style"),
    subtitle: prefsGettext._("Choose accent color variation"),
    model: new Gtk.StringList({ strings }),
    selected: selectedDisplayIndex >= 0 ? selectedDisplayIndex : 0,
  });

  group.add(comboRow);

  // Handle selection changes, preventing selection of headers
  comboRow.connect("notify::selected", () => {
    const selectedDisplayIndex = comboRow.selected;
    const originalIndex = mapping[selectedDisplayIndex];

    // If user selected a header (originalIndex === -1), revert to previous valid selection
    if (originalIndex === -1) {
      const currentStored = settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE);
      const validDisplayIndex = mapping.findIndex(
        (index) => index === currentStored,
      );
      if (validDisplayIndex >= 0) {
        comboRow.selected = validDisplayIndex;
      }
      return;
    }

    settings.set_enum(SettingsKey.ACCENT_COLOR_STYLE, originalIndex);
  });

  return comboRow;
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
      const showWeekday = settings.get_boolean(SettingsKey.SHOW_WEEKDAY);
      const showDateOrWeekday = showDate || showWeekday;

      // Date and divider color controls should be visible when the user
      // is showing either the date or the weekday (weekday may be shown
      // independently of the full date). Previously these controls only
      // appeared when the full date was enabled.
      dividerColorRow.visible = isCustom && showDateOrWeekday;
      dateColorRow.visible = isCustom && showDateOrWeekday;
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
  settings.connect("changed::show-weekday", () => updateColorRowsVisibility());
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
