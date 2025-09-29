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
  // We need to present a filtered list when the date/weekday aren't shown
  // because some accent styles only make sense with the date/divider visible.
  const allConfigs = PREFERENCE_CONFIGS.ACCENT_STYLE;

  // Helper to build the visible model and a mapping from visible index ->
  // original index in ACCENT_STYLE_CONFIGS.
  const buildModel = (showDateOrWeekday: boolean) => {
    const visibleConfigs = allConfigs.filter((c) => {
      // If a config requires the date to be visible and the date/weekday are
      // not showing, hide it from the list.
      if ((c as any).requiresDateVisible && !showDateOrWeekday) return false;
      return true;
    });

    const strings = visibleConfigs.map((c) => c.displayName(prefsGettext));
    const mapping: number[] = visibleConfigs.map((vc) =>
      allConfigs.findIndex((c) => c === vc),
    );

    return { strings, mapping } as const;
  };

  // Determine initial visibility based on settings
  const showDate = settings.get_boolean(SettingsKey.SHOW_DATE);
  const showWeekday = settings.get_boolean(SettingsKey.SHOW_WEEKDAY);
  const showDateOrWeekday = showDate || showWeekday;

  const { strings, mapping } = buildModel(showDateOrWeekday);

  // Map the stored enum (which refers to the original configs array) to a
  // visible index for the combo.
  const storedIndex = settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE);
  let selectedVisible = mapping.indexOf(storedIndex);
  if (selectedVisible === -1) selectedVisible = 0;

  const comboRow = new Adw.ComboRow({
    title: prefsGettext._("Accent Style"),
    subtitle: prefsGettext._("Choose accent color variation"),
    model: new Gtk.StringList({ strings }),
    selected: selectedVisible,
  });

  group.add(comboRow);

  // When the user selects a visible item, write the original index to
  // settings so the underlying code keeps using the canonical config index.
  comboRow.connect("notify::selected", () => {
    const visibleIdx = comboRow.selected;
    const realIdx = mapping[visibleIdx] ?? 0;
    settings.set_enum(SettingsKey.ACCENT_COLOR_STYLE, realIdx);
  });

  // Update the combo when date/weekday visibility changes
  const updateForDateVisibility = () => {
    const sDate = settings.get_boolean(SettingsKey.SHOW_DATE);
    const sWeek = settings.get_boolean(SettingsKey.SHOW_WEEKDAY);
    const showAny = sDate || sWeek;
    const built = buildModel(showAny);
    comboRow.model = new Gtk.StringList({ strings: built.strings });

    // Attempt to preserve the current logical selection by mapping the
    // stored settings value to the new visible list. Also implement the
    // save/restore policy: if styles that require the date are hidden when
    // the user turns off date/weekday, we save the previous canonical value
    // and switch to the configured fallback so the UI remains sensible.
    const currentStored = settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE);

    if (!showAny) {
      // We're hiding date/weekday. If the currently selected canonical style
      // requires the date, save it and switch to its fallback.
      const currentConfig = PREFERENCE_CONFIGS.ACCENT_STYLE[currentStored];
      if ((currentConfig as any)?.requiresDateVisible) {
        // Save the canonical index so we can restore it when date/weekday
        // are shown again.
        settings.set_enum(
          SettingsKey.ACCENT_STYLE_SAVED_BEFORE_HIDE as any,
          currentStored,
        );

        // Use the fallback index if available; otherwise default to 1
        // (solid) which is a safe neutral choice.
        const fallback = (currentConfig as any).fallbackIndex ?? 1;
        settings.set_enum(SettingsKey.ACCENT_COLOR_STYLE, fallback);
      }
    } else {
      // Date/weekday are shown. If we have a saved value from before the
      // hide, restore it and clear the saved key.
      const saved = settings.get_enum(
        SettingsKey.ACCENT_STYLE_SAVED_BEFORE_HIDE as any,
      );
      if (typeof saved === "number" && saved >= 0) {
        settings.set_enum(SettingsKey.ACCENT_COLOR_STYLE, saved);
        // Clear the saved value by setting a sentinel (-1) which is used to
        // indicate 'none'. The schema should accept -1 for our transient
        // internal key; if not, the preferences manager treats it as a
        // normal integer which is fine for local use.
        settings.set_enum(
          SettingsKey.ACCENT_STYLE_SAVED_BEFORE_HIDE as any,
          -1,
        );
      }
    }

    let visIdx = built.mapping.indexOf(
      settings.get_enum(SettingsKey.ACCENT_COLOR_STYLE),
    );
    if (visIdx === -1) visIdx = 0;
    comboRow.selected = visIdx;
  };

  settings.connect("changed::show-date", updateForDateVisibility);
  settings.connect("changed::show-weekday", updateForDateVisibility);

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
