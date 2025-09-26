/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";

// GNOME Shell imports for version detection
declare const imports: any;

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { SETTINGS, PrefItems, Errors } from "./constants/index.js";
import SettingsKey from "./models/settings_keys.js";
import { StyleService } from "./services/style_service.js";
import { ClockFormatter, TimeFormat } from "./core/clock_formatter.js";
import { fuzzinessFromEnumIndex } from "./utils/fuzziness_utils.js";
import { createTranslatePackGetter } from "./utils/translate_pack_utils.js";
import { prefsGettext } from "./utils/gettext_utils_prefs.js";
import { logErr, logWarn } from "./utils/error_utils.js";
import { parseGnomeShellVersionString } from "./utils/shell_version_utils.js";

/**
 * @returns a word pack that contains the strings for telling the time and date
 */
export const TRANSLATE_PACK = createTranslatePackGetter(prefsGettext);

/**
 * Represents a binding between a setting and a property of a widget.
 * This is used to dynamically update the widget's property based on the value of the setting.
 *
 * It is currenty only used in the `addSwitchRow` method.
 *
 * @property settingKey The key of the setting in the settings schema.
 * @property property The name of the property in the widget to bind the setting to.
 */
type SettingBinding = {
  settingKey: string;
  property: string;
};

/**
 * Preferences Window for the Text Clock extension
 */
export default class TextClockPrefs extends ExtensionPreferences {
  async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    const settings = this.getSettings();

    // Check GNOME Shell version to determine if accent color is available
    const shellVersion = this.#getShellVersion();
    const supportsAccentColor = shellVersion >= 47;

    // Determine initial window size based on color mode
    const initialColorMode = settings.get_enum(SettingsKey.COLOR_MODE);
    const isCustomMode = initialColorMode === 2;
    const initialHeight = isCustomMode ? 800 : 650;
    const windowWidth = 600;

    // Set initial default size based on current color mode
    try {
      window.set_default_size(windowWidth, initialHeight);
    } catch (e) {
      logWarn(`Could not set initial window size: ${e}`);
    }

    // Track the current desired size to maintain it across focus changes
    let currentDesiredHeight = initialHeight;

    // Function to update window size based on color mode
    const updateWindowSize = () => {
      try {
        const colorMode = settings.get_enum(SettingsKey.COLOR_MODE);
        const isCustom = colorMode === 2;
        const newHeight = isCustom ? 800 : 650;

        // Only resize if the height actually needs to change
        if (newHeight !== currentDesiredHeight) {
          currentDesiredHeight = newHeight;

          // Use GLib.idle_add to ensure the resize happens at the right time
          GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            try {
              // First try the standard GTK approach
              window.set_default_size(windowWidth, currentDesiredHeight);

              // Also set size request as a hint for minimum size
              window.set_size_request(
                windowWidth,
                Math.min(currentDesiredHeight, 650),
              );

              // Force a resize if the window is already shown
              if (window.get_visible()) {
                // Get the current window surface/native window
                const surface = window.get_surface();
                if (surface) {
                  // Request the window to resize itself
                  window.queue_resize();
                }
              }
            } catch (resizeError) {
              logWarn(`Could not resize window: ${resizeError}`);
            }
            return false; // Don't repeat
          });
        }
      } catch (e) {
        logWarn(`Error in updateWindowSize: ${e}`);
      }
    };

    const page = this.#createAndAddPageToWindow(window);

    const clockSettingsGroup = this.#createAndAddGroupToPage(
      page,
      "Clock Settings",
      "Customize the appearance and behavior of the clock",
    );

    this.#addShowDateSwitchRow(clockSettingsGroup, settings);

    this.#addShowWeekdaySwitchRow(clockSettingsGroup, settings);

    this.#addTimeFormatComboRow(clockSettingsGroup, settings);

    this.#createFuzzinessComboRow(clockSettingsGroup, settings);

    this.#addDividerPresetRow(clockSettingsGroup, settings);

    const clockColorSettingsGroup = this.#createAndAddGroupToPage(
      page,
      "Clock Colors",
      "Customize the colors of the clock and date text",
    );

    this.#addColorModeRow(
      clockColorSettingsGroup,
      settings,
      supportsAccentColor,
      updateWindowSize,
    );

    return Promise.resolve();
  }

  /**
   * Create a page and add it to the window
   *
   * @param window The window to add the page to
   *
   * @returns The page
   */
  #createAndAddPageToWindow(window: Adw.PreferencesWindow) {
    const page = new Adw.PreferencesPage({
      title: _("Text Clock"),
    });
    window.add(page);
    return page;
  }

  /**
   * Create and add the clock
   */

  /**
   * Create a group and add it to the page
   *
   * @param page The page to add the group to
   *
   * @returns The group
   */
  #createAndAddGroupToPage(
    page: Adw.PreferencesPage,
    title_tag: string,
    description_tag: string,
  ) {
    const group = new Adw.PreferencesGroup({
      title: _(title_tag),
      description: _(description_tag),
    });
    page.add(group);
    return group;
  }

  /**
   * Add a combo row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param settingKey The key in the settings schema to bind the combo to
   * @param props The properties of the combo row
   *
   * @returns The combo row
   */
  #addComboRow(
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
   * Add a switch row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param props The properties of the switch row
   * @param settingKey The key in the settings schema to bind the switch to
   * @param settingBindings The settings to bind to the switch
   *
   * @returns The switch row
   */
  #addSwitchRow(
    group: Adw.PreferencesGroup,
    props: Partial<Adw.SwitchRow.ConstructorProps>,
    settings: Gio.Settings,
    settingKey: string,
    settingBindings?: SettingBinding[],
  ): Adw.SwitchRow {
    const row = new Adw.SwitchRow(props);
    group.add(row);

    this.#bindSettingsToProperty(row, settings, settingKey, "active");

    settingBindings?.forEach((binding) => {
      this.#bindSettingsToProperty(
        row,
        settings,
        binding.settingKey,
        binding.property,
      );
    });
    return row;
  }

  /**
   * Bind a setting to a property of a widget
   *
   * @param widget The widget to bind the setting to
   * @param settingKey The key in the settings schema to bind
   * @param property The property of the widget to bind the setting to
   */
  #bindSettingsToProperty(
    widget: Adw.ActionRow,
    settings: Gio.Settings,
    settingKey: string,
    property: string,
  ) {
    try {
      settings!.bind(
        settingKey,
        widget,
        property,
        Gio.SettingsBindFlags.DEFAULT,
      );
    } catch (error: any) {
      logErr(error, `${_(Errors.ERROR_BINDING_SETTINGS_FOR_)} ${widget.title}`);
    }
  }

  /**
   * Create a combo row for the fuzziness setting and add it to the group
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The combo row
   */
  #createFuzzinessComboRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ComboRow {
    const fuzzinessComboInfo = {
      title: _(PrefItems.FUZZINESS.title),
      subtitle: _(PrefItems.FUZZINESS.subtitle),
      model: new Gtk.StringList({ strings: ["1", "5", "10", "15"] }),
      selected: settings!.get_enum(SettingsKey.FUZZINESS),
    };

    return this.#addComboRow(
      group,
      settings,
      SETTINGS.FUZZINESS,
      fuzzinessComboInfo,
    );
  }

  /**
   * Create a combo row for the time format setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The combo row
   */
  #addTimeFormatComboRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ComboRow {
    const timeFormatComboInfo = {
      title: _(PrefItems.TIME_FORMAT.title),
      subtitle: _(PrefItems.TIME_FORMAT.subtitle),
      model: this.#getTimeFormatsList(settings),
      selected: settings!.get_enum(SettingsKey.TIME_FORMAT),
    };

    return this.#addComboRow(
      group,
      settings,
      SETTINGS.TIME_FORMAT,
      timeFormatComboInfo,
    );
  }

  /**
   * Get a list of the localized time format string templates
   *
   * @param settings The settings schema
   *
   * @returns A list of the localized time format string templates
   */
  #getTimeFormatsList(settings: Gio.Settings): Gtk.StringList {
    const clockFormatter = new ClockFormatter(TRANSLATE_PACK());

    const date = new Date();
    const fuzzinessEnumIndex = settings.get_enum(SettingsKey.FUZZINESS);
    const fuzziness = fuzzinessFromEnumIndex(fuzzinessEnumIndex);

    const timeFormatOne = clockFormatter.getClockText(
      date,
      false,
      false,
      TimeFormat.FORMAT_ONE,
      fuzziness,
    );

    const timeFormatTwo = clockFormatter.getClockText(
      date,
      false,
      false,
      TimeFormat.FORMAT_TWO,
      fuzziness,
    );

    return new Gtk.StringList({
      strings: [timeFormatOne, timeFormatTwo],
    });
  }

  /**
   * Create a switch row for the show weekday setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The switch row
   */
  #addShowWeekdaySwitchRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.SwitchRow {
    const showWeekdaySwitchInfo = {
      title: _(PrefItems.SHOW_WEEKDAY.title),
      subtitle: _(PrefItems.SHOW_WEEKDAY.subtitle),
      sensitive: settings!.get_boolean(SettingsKey.SHOW_DATE),
    };
    return this.#addSwitchRow(
      group,
      showWeekdaySwitchInfo,
      settings,
      SettingsKey.SHOW_WEEKDAY,
      [
        {
          settingKey: SettingsKey.SHOW_DATE,
          property: "sensitive",
        },
      ],
    );
  }

  /**
   * Create a switch row for the show date setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The switch row
   */
  #addShowDateSwitchRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.SwitchRow {
    const showDateSwitchInfo = {
      title: _(PrefItems.SHOW_DATE.title),
      subtitle: _(PrefItems.SHOW_DATE.subtitle),
    };
    return this.#addSwitchRow(
      group,
      showDateSwitchInfo,
      settings,
      SettingsKey.SHOW_DATE,
    );
  }

  /**
   * Create a color control widget with accent switch and color picker
   */
  #createColorControlWidget(
    settings: Gio.Settings,
    styleSvc: any,
    colorSettingsKey: string,
    accentSettingsKey: string,
    errorContext: string,
  ): Gtk.Widget {
    const control = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 12,
      halign: Gtk.Align.CENTER,
    });

    // Create accent switch
    const accentSwitch = new Gtk.Switch();
    accentSwitch.set_valign(Gtk.Align.CENTER);

    // Create switch label
    const switchLabel = new Gtk.Label({
      label: _("Accent"),
      valign: Gtk.Align.CENTER,
    });

    // Create color picker
    const colorButton = new Gtk.ColorButton();
    colorButton.set_size_request(40, 40);
    colorButton.set_valign(Gtk.Align.CENTER);

    // Function to update color picker based on accent switch state
    const updateColorPicker = () => {
      const useAccent = accentSwitch.get_active();

      if (useAccent) {
        // Show accent color and make read-only (but not disabled to avoid graying out)
        try {
          const accentColor = styleSvc.getAccentColor().toString();
          const rgba = new Gdk.RGBA();
          rgba.parse(accentColor);
          colorButton.set_rgba(rgba);
        } catch (e) {
          logErr(e, "Error setting accent color");
        }
        // Keep button enabled but disconnect color-set signal to make it read-only
        colorButton.set_sensitive(true);
      } else {
        // Show custom color and enable picker
        try {
          const customColor = settings.get_string(colorSettingsKey);
          const rgba = new Gdk.RGBA();
          rgba.parse(customColor);
          colorButton.set_rgba(rgba);
        } catch (e) {
          logErr(e, "Error setting custom color");
        }
        colorButton.set_sensitive(true);
      }
    };

    // Bind accent switch to settings
    try {
      settings.bind(
        accentSettingsKey,
        accentSwitch,
        "active",
        Gio.SettingsBindFlags.DEFAULT,
      );
    } catch (e) {
      logErr(e, `Error binding ${errorContext}`);
    }

    // Update color picker when accent switch changes
    accentSwitch.connect("state-set", () => {
      // Use GLib.idle_add to ensure the setting is updated before we read it
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        updateColorPicker();
        return false; // Don't repeat
      });
    });

    // Handle custom color changes (only when not using accent)
    colorButton.connect("color-set", () => {
      if (!accentSwitch.get_active()) {
        const newRgba = colorButton.get_rgba();
        settings.set_string(colorSettingsKey, newRgba.to_string());
      } else {
        // If accent is enabled, revert the color picker back to accent color
        // This prevents the picker from changing when clicked while in accent mode
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
          updateColorPicker();
          return false;
        });
      }
    });

    // Set initial state
    updateColorPicker();

    // Add widgets to container
    control.append(switchLabel);
    control.append(accentSwitch);
    control.append(colorButton);

    // Expose color button for parent to update when accent color changes
    (control as any)._colorButton = colorButton;
    (control as any)._accentSwitch = accentSwitch;
    (control as any)._updateColorPicker = updateColorPicker;

    return control;
  }

  /**
   * Common method to create a color row
   */
  #createColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    styleSvc: any,
    title: string,
    colorKey: string,
    accentKey: string,
    errorContext: string,
  ): Adw.ActionRow {
    const control = this.#createColorControlWidget(
      settings,
      styleSvc,
      colorKey,
      accentKey,
      errorContext,
    );

    const row = new Adw.ActionRow({
      title: title,
    });
    row.add_suffix(control);
    group.add(row);

    // expose color button for redraw from parent
    (row as any)._colorButton = (control as any)._colorButton;
    (row as any)._accentSwitch = (control as any)._accentSwitch;
    (row as any)._updateColorPicker = (control as any)._updateColorPicker;
    return row;
  }

  /**
   * Add a color row for clock color
   */
  #addClockColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    styleSvc: any,
  ): Adw.ActionRow {
    return this.#createColorRow(
      group,
      settings,
      styleSvc,
      _("Time Color"),
      SettingsKey.CLOCK_COLOR,
      SettingsKey.CLOCK_USE_ACCENT,
      "clock-use-accent",
    );
  }

  /**
   * Add a color row for date color
   */
  #addDateColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    styleSvc: any,
  ): Adw.ActionRow {
    return this.#createColorRow(
      group,
      settings,
      styleSvc,
      _("Date Color"),
      SettingsKey.DATE_COLOR,
      SettingsKey.DATE_USE_ACCENT,
      "date-use-accent",
    );
  }

  /**
   * Add a color row for divider color
   */
  #addDividerColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    styleSvc: any,
  ): Adw.ActionRow {
    return this.#createColorRow(
      group,
      settings,
      styleSvc,
      _("Divider Color"),
      SettingsKey.DIVIDER_COLOR,
      SettingsKey.DIVIDER_USE_ACCENT,
      "divider-use-accent",
    );
  }

  /**
   * Add a combo row for divider preset and conditional entry for custom text
   */
  #addDividerPresetRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): void {
    // Combo row for divider preset
    const presetRow = new Adw.ComboRow({
      title: _("Divider Preset"),
      subtitle: _("Choose a preset divider or select custom"),
      model: new Gtk.StringList({ strings: ["|", "•", "‖", "—", "Custom"] }),
      selected: settings!.get_enum(SettingsKey.DIVIDER_PRESET),
    });
    group.add(presetRow);

    // Entry row for custom divider text (initially hidden)
    const customEntryRow = new Adw.EntryRow({
      title: _("Custom Divider Text"),
      text: settings.get_string(SettingsKey.CUSTOM_DIVIDER_TEXT),
    });
    group.add(customEntryRow);

    // Show/hide custom entry based on preset selection
    const updateCustomEntryVisibility = () => {
      const selectedPreset = presetRow.selected;
      const isCustom = selectedPreset === 4; // "Custom" is index 4
      customEntryRow.visible = isCustom;
    };

    // Initial visibility
    updateCustomEntryVisibility();

    // Connect preset change
    presetRow.connect("notify::selected", () => {
      settings.set_enum(SettingsKey.DIVIDER_PRESET, presetRow.selected);
      updateCustomEntryVisibility();
    });

    // Connect custom text change
    settings.bind(
      SettingsKey.CUSTOM_DIVIDER_TEXT,
      customEntryRow,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }

  /**
   * Get the GNOME Shell version as a number
   */
  #getShellVersion(): number {
    // Try a few safer methods in order to discover the running GNOME Shell version.
    // 1) Look for GNOME_SHELL_VERSION environment variable (set in some distros / sessions)
    try {
      const versionString = GLib.getenv("GNOME_SHELL_VERSION");
      const parsed = parseGnomeShellVersionString(versionString as any);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    } catch (e) {
      logWarn(`Error reading GNOME_SHELL_VERSION env: ${e}`);
    }

    // 2) Try running the system gnome-shell binary with --version. This is non-invasive
    //    and works in many environments where the env var isn't set. It returns a string
    //    like "GNOME Shell 47.1".
    try {
      const [ok, out] = GLib.spawn_command_line_sync("gnome-shell --version");
      if (ok && out) {
        const outStr = out.toString();
        const parsed = parseGnomeShellVersionString(outStr);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore -- might not be available in this environment
      logWarn(`Could not run 'gnome-shell --version': ${e}`);
    }

    // 3) As a last programmatic attempt, try to use imports.misc.config.LIBMUTTER_API_VERSION
    //    if it's available. Wrap in try/catch because loading this module can throw in
    //    some pref contexts (see runtime SyntaxError in logs).
    try {
      // Access via imports if present. This may throw; catch and continue.
      if (
        typeof imports !== "undefined" &&
        imports.misc &&
        imports.misc.config
      ) {
        const Config = imports.misc.config;
        const apiVersion = Config.LIBMUTTER_API_VERSION;
        if (typeof apiVersion === "number") {
          // Convert LIBMUTTER API version to GNOME Shell major (empirical mapping)
          const shellVersion = apiVersion + 35; // 10 -> 45, 11 -> 46, etc.
          return shellVersion;
        }
      }
    } catch (error) {
      logWarn(
        `Failed to detect GNOME Shell version from imports.misc.config: ${error}`,
      );
    }

    // Final fallback: assume GNOME Shell 45 (minimum supported platform for this extension)
    logWarn("Could not detect GNOME Shell version, assuming 45");
    return 45;
  }

  /**
   * Add a combo row for color mode and conditional color pickers
   */
  #addColorModeRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    supportsAccentColor: boolean = true,
    updateWindowSize: () => void,
  ): void {
    // Build the model based on whether accent color is supported
    const modelStrings = ["Default"];
    if (supportsAccentColor) {
      modelStrings.push("Accent Color");
    }
    modelStrings.push("Custom Colors");

    // Get current setting, but adjust if accent color is not supported
    let currentSelected = settings.get_enum(SettingsKey.COLOR_MODE);
    if (!supportsAccentColor && currentSelected === 1) {
      // If accent color was selected but is no longer supported, switch to default
      currentSelected = 0;
      settings.set_enum(SettingsKey.COLOR_MODE, 0);
    } else if (!supportsAccentColor && currentSelected === 2) {
      // Custom colors becomes index 1 when accent color is not available
      currentSelected = 1;
    }

    // Combo row for color mode
    const colorModeRow = new Adw.ComboRow({
      title: _(PrefItems.COLOR_MODE.title),
      subtitle: _(PrefItems.COLOR_MODE.subtitle),
      model: new Gtk.StringList({ strings: modelStrings }),
      selected: currentSelected,
    });
    group.add(colorModeRow);

    // Create and add the color rows to the group
    const styleSvc = new StyleService(settings);
    const clockColorRow = this.#addClockColorRow(group, settings, styleSvc);
    const dateColorRow = this.#addDateColorRow(group, settings, styleSvc);
    const dividerColorRow = this.#addDividerColorRow(group, settings, styleSvc);

    // Get the update functions for each color control
    const clockUpdater = clockColorRow
      ? (clockColorRow as any)._updateColorPicker
      : null;
    const dividerUpdater = dividerColorRow
      ? (dividerColorRow as any)._updateColorPicker
      : null;
    const dateUpdater = dateColorRow
      ? (dateColorRow as any)._updateColorPicker
      : null;

    // Listen for system accent-color changes, update accent color buttons
    try {
      const ifaceSettings = new Gio.Settings({
        schema: "org.gnome.desktop.interface",
      });
      ifaceSettings.connect("changed::accent-color", () => {
        try {
          // Trigger update of color pickers that are using accent colors
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

    // Function to update visibility of color rows
    const updateColorRowsVisibility = () => {
      const selectedMode = colorModeRow.selected;
      // Adjust index based on whether accent color is available
      const isCustom = supportsAccentColor
        ? selectedMode === 2
        : selectedMode === 1;

      // Show/hide the color rows based on whether Custom Colors is selected
      clockColorRow.visible = isCustom;
      dividerColorRow.visible = isCustom;
      dateColorRow.visible = isCustom;

      // Additionally, hide date and divider rows when Show Date is false
      try {
        const showDate = settings.get_boolean(SettingsKey.SHOW_DATE);
        dividerColorRow.visible = isCustom && showDate;
        dateColorRow.visible = isCustom && showDate;
      } catch (e) {
        logErr(e, "Error updating color row visibility");
      }
    };

    // Initial visibility
    updateColorRowsVisibility();

    // Connect mode change
    colorModeRow.connect("notify::selected", () => {
      let settingValue = colorModeRow.selected;
      // Adjust the setting value based on whether accent color is available
      if (!supportsAccentColor && settingValue === 1) {
        // Custom colors is index 1 when accent color is not available, but stored as 2
        settingValue = 2;
      }
      settings.set_enum(SettingsKey.COLOR_MODE, settingValue);
      updateColorRowsVisibility();
      updateWindowSize(); // Resize window when mode changes
    });
    // Update visibility when Show Date changes
    settings.connect("changed::show-date", () => updateColorRowsVisibility());
  }
}
