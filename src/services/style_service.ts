/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Reactive style management for clock colors and divider text.
 *
 * Handles color modes (default/accent/custom) and system accent color integration.
 * Registered targets update automatically when settings change.
 */

import Gio from "gi://Gio";

import { getDividerText } from "./preference_service.js";
import { Color } from "../models/color.js";
import SettingsKey from "../models/settings_keys.js";
import { accentNameToHex } from "../utils/color/accent_color_utils.js";
import { logWarn } from "../utils/error_utils.js";
import { applyAccentStyle } from "./preference_service.js";

/** Style properties that can be applied to UI elements. */
export interface StyleConfig {
  /** Color for the main time display */
  clockColor?: Color;

  /** Color for the date display */
  dateColor?: Color;

  /** Color for the divider between time and date */
  dividerColor?: Color;

  /** Text content for the divider (e.g., '|', ' → ', custom text) */
  dividerText?: string;
}

/** Objects that can receive style updates from StyleService. */
export interface StyleTarget {
  /** Apply the specified color to clock text elements */
  setClockColor(color: Color): void;

  /** Apply the specified color to date text elements */
  setDateColor(color: Color): void;

  /** Apply the specified color to divider elements */
  setDividerColor(color: Color): void;

  /** Update the divider text content */
  setDividerText(text: string): void;
}

/** Reactive style manager - registered targets update automatically on settings changes. */
export class StyleService {
  #settings: Gio.Settings;
  #targets: Set<StyleTarget> = new Set();
  #signalConnections: number[] = [];
  #ifaceSettings: Gio.Settings | null = null;
  #ifaceSignalConnection: number | null = null;

  /** @param settings - Extension GSettings for monitoring style changes */
  constructor(settings: Gio.Settings) {
    this.#settings = settings;
    this.#connectToSettings();
    this.#connectToInterfaceSettings();
  }

  /** Register a target for automatic updates. Applies current styles immediately. */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.applyStyles(target);
  }

  /** Unregister a target to prevent memory leaks when UI components are destroyed. */
  unregisterTarget(target: StyleTarget): void {
    this.#targets.delete(target);
  }

  /** Apply styles to a specific target. */
  applyStyles(target: StyleTarget, config?: StyleConfig): void {
    const effectiveConfig = config || this.getCurrentStyles();

    if (effectiveConfig.clockColor) {
      target.setClockColor(effectiveConfig.clockColor);
    }
    if (effectiveConfig.dateColor) {
      target.setDateColor(effectiveConfig.dateColor);
    }
    if (effectiveConfig.dividerColor) {
      target.setDividerColor(effectiveConfig.dividerColor);
    }
    if (effectiveConfig.dividerText) {
      target.setDividerText(effectiveConfig.dividerText);
    }
  }

  /** Apply current styles to all registered targets (called automatically on settings changes). */
  applyToAllTargets(): void {
    const config = this.getCurrentStyles();
    for (const target of this.#targets) {
      this.applyStyles(target, config);
    }
  }

  /**
   * Get system accent color from GNOME desktop settings.
   * Maps named colors like 'blue' to hex. Fallback: white.
   */
  getAccentColor(): Color {
    try {
      const ifaceSettings =
        this.#ifaceSettings ??
        new Gio.Settings({
          schema: "org.gnome.desktop.interface",
        });

      const accent = ifaceSettings.get_string("accent-color");
      if (!accent) {
        return new Color("#FFFFFF");
      }

      // Map named colors (e.g., "blue") to hex, or use accent value directly
      const colorValue = accentNameToHex(accent) ?? accent;
      return new Color(colorValue);
    } catch (e) {
      logWarn(`Could not read accent color: ${e}`);
      return new Color("#FFFFFF");
    }
  }

  /** Disconnect all signals and clear resources. Call when extension is disabled. */
  destroy(): void {
    // Disconnect all settings signals
    for (const connectionId of this.#signalConnections) {
      this.#settings.disconnect(connectionId);
    }
    this.#signalConnections = [];

    // Disconnect interface settings signal (if any)
    if (this.#ifaceSettings !== null && this.#ifaceSignalConnection !== null) {
      this.#ifaceSettings.disconnect(this.#ifaceSignalConnection);
      this.#ifaceSignalConnection = null;
    }
    this.#ifaceSettings = null;

    // Clear all targets
    this.#targets.clear();
  }

  // Private methods

  /** Connect to style-related settings for automatic target updates. */
  #connectToSettings(): void {
    const colorSettings = [
      SettingsKey.COLOR_MODE,
      SettingsKey.ACCENT_COLOR_STYLE,
      SettingsKey.CLOCK_COLOR,
      SettingsKey.DATE_COLOR,
      SettingsKey.DIVIDER_COLOR,
      SettingsKey.DIVIDER_PRESET,
      SettingsKey.CUSTOM_DIVIDER_TEXT,
      // Per-section accent toggles (so changes trigger applyToAllTargets)
      SettingsKey.CLOCK_USE_ACCENT,
      SettingsKey.DATE_USE_ACCENT,
      SettingsKey.DIVIDER_USE_ACCENT,
    ];

    for (const setting of colorSettings) {
      const connectionId = this.#settings.connect(`changed::${setting}`, () => {
        this.applyToAllTargets();
      });
      this.#signalConnections.push(connectionId);
    }
  }

  /**
   * Connect to org.gnome.desktop.interface for live accent color updates.
   * Extension updates immediately when system accent color changes.
   */
  #connectToInterfaceSettings(): void {
    // Avoid reconnecting if already connected
    if (this.#ifaceSettings !== null && this.#ifaceSignalConnection !== null) {
      return;
    }

    try {
      this.#ifaceSettings = new Gio.Settings({
        schema: "org.gnome.desktop.interface",
      });

      // Listen for accent-color changes
      this.#ifaceSignalConnection = this.#ifaceSettings.connect(
        "changed::accent-color",
        () => {
          // Only update if we're actually using accent color mode; applyToAllTargets
          // will read the current color mode and act accordingly.
          this.applyToAllTargets();
        },
      );
    } catch (e) {
      logWarn(
        `Could not connect to org.gnome.desktop.interface settings: ${e}`,
      );
      this.#ifaceSettings = null;
      this.#ifaceSignalConnection = null;
    }
  }

  /**
   * Get the current style configuration.
   *
   * Reads all relevant settings and applies color mode logic to determine
   * final colors for each UI element.
   *
   * @returns StyleConfig with colors and divider text from current settings
   */
  getCurrentStyles(): StyleConfig {
    const dividerPreset = this.#settings.get_enum(SettingsKey.DIVIDER_PRESET);
    const customDividerText = this.#settings.get_string(
      SettingsKey.CUSTOM_DIVIDER_TEXT,
    );
    const colorMode = this.#settings.get_enum(SettingsKey.COLOR_MODE);

    // Define color mode enum for clarity
    enum ColorMode {
      DEFAULT = 0,
      ACCENT = 1,
      CUSTOM = 2,
    }

    let clockColor: Color;
    let dateColor: Color;
    let dividerColor: Color;

    if (colorMode === ColorMode.ACCENT) {
      // Accent color mode
      const accentColor = this.getAccentColor();
      const accentStyle = this.#settings.get_enum(
        SettingsKey.ACCENT_COLOR_STYLE,
      );

      // Determine whether the date is currently shown so accent styles that
      // expect the date/divider to be present can fall back appropriately.
      // Use the configuration system to apply the selected accent style.
      const {
        clockColor: accentClockColor,
        dateColor: accentDateColor,
        dividerColor: accentDividerColor,
      } = applyAccentStyle(accentColor, accentStyle);

      clockColor = accentClockColor;
      dateColor = accentDateColor;
      dividerColor = accentDividerColor;
    } else if (colorMode === ColorMode.CUSTOM) {
      // Custom colors mode, but allow per-section "use accent" overrides
      const accentColor = this.getAccentColor();

      const useAccentClock = this.#settings.get_boolean(
        SettingsKey.CLOCK_USE_ACCENT,
      );
      const useAccentDate = this.#settings.get_boolean(
        SettingsKey.DATE_USE_ACCENT,
      );
      const useAccentDivider = this.#settings.get_boolean(
        SettingsKey.DIVIDER_USE_ACCENT,
      );

      if (useAccentClock) {
        clockColor = accentColor;
      } else {
        clockColor = new Color(
          this.#settings.get_string(SettingsKey.CLOCK_COLOR),
        );
      }

      if (useAccentDate) {
        dateColor = accentColor;
      } else {
        dateColor = new Color(
          this.#settings.get_string(SettingsKey.DATE_COLOR),
        );
      }

      if (useAccentDivider) {
        dividerColor = accentColor;
      } else {
        dividerColor = new Color(
          this.#settings.get_string(SettingsKey.DIVIDER_COLOR),
        );
      }
    } else {
      // Default mode (ColorMode.DEFAULT or any unexpected value)
      clockColor = new Color("#FFFFFF");
      dateColor = new Color("#FFFFFF");
      dividerColor = new Color("#FFFFFF");
    }

    return {
      clockColor,
      dateColor,
      dividerColor,
      dividerText: getDividerText(dividerPreset, customDividerText),
    };
  }
}
