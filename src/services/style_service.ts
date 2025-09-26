/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Service responsible for managing extension styles and colors
 *
 * This service centralizes all color and style-related operations,
 * providing a clean interface for applying styles to UI elements.
 */

import Gio from "gi://Gio";
import { normalizeColor, accentNameToHex } from "../utils/color";
import { logInfo, logWarn } from "../utils/error_utils.js";
import { getDividerText } from "../constants/index.js";
import SettingsKey from "../models/settings_keys.js";
import { Color } from "../models/color.js";

/**
 * Configuration for styling elements
 */
export interface StyleConfig {
  clockColor?: Color;
  dateColor?: Color;
  dividerColor?: Color;
  dividerText?: string;
}

/**
 * Interface for objects that can receive style updates
 */
export interface StyleTarget {
  setClockColor(color: Color): void;
  setDateColor(color: Color): void;
  setDividerColor(color: Color): void;
  setDividerText(text: string): void;
}

/**
 * Service for managing styles and colors throughout the extension
 */
export class StyleService {
  #settings: Gio.Settings;
  #targets: Set<StyleTarget> = new Set();
  #signalConnections: number[] = [];
  #ifaceSettings: Gio.Settings | null = null;
  #ifaceSignalConnection: number | null = null;

  constructor(settings: Gio.Settings) {
    this.#settings = settings;
    this.#connectToSettings();
    this.#connectToInterfaceSettings();
  }

  /**
   * Register a target to receive style updates
   */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.#applyCurrentStyles(target);
  }

  /**
   * Unregister a target from receiving style updates
   */
  unregisterTarget(target: StyleTarget): void {
    this.#targets.delete(target);
  }

  /**
   * Apply styles to a specific target
   */
  applyStyles(target: StyleTarget, config?: StyleConfig): void {
    const effectiveConfig = config || this.#getCurrentStyleConfig();

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

  /**
   * Apply current styles to all registered targets
   */
  applyToAllTargets(): void {
    const config = this.#getCurrentStyleConfig();
    for (const target of this.#targets) {
      this.applyStyles(target, config);
    }
  }

  /**
   * Get the current style configuration from settings
   */
  getCurrentStyles(): StyleConfig {
    return this.#getCurrentStyleConfig();
  }

  /**
   * Validate and normalize a color value
   */
  validateColor(color: string, fallback: string = "#FFFFFF"): string {
    try {
      return normalizeColor(color);
    } catch (err) {
      logWarn(`Invalid color "${color}", using fallback "${fallback}": ${err}`);
      return fallback;
    }
  }

  /**
   * Get the system's accent color
   */
  getAccentColor(): Color {
    // Try to read the selected accent color from the system settings.
    try {
      // Prefer using the cached ifaceSettings if available (created in
      // #connectToInterfaceSettings). Fall back to creating a temporary
      // Gio.Settings if necessary.
      const ifaceSettings =
        this.#ifaceSettings ??
        new Gio.Settings({
          schema: "org.gnome.desktop.interface",
        });

      if (ifaceSettings && ifaceSettings.get_string) {
        const accent = ifaceSettings.get_string("accent-color");
        if (accent) {
          // If the accent is a named token (e.g. "yellow"), map it to a hex value.
          const mapped = accentNameToHex(accent);
          if (mapped) {
            try {
              return new Color(mapped);
            } catch (e) {
              logWarn(`Mapped accent color invalid: ${e}`);
            }
          }

          // Otherwise try constructing Color directly (may throw if not concrete)
          try {
            return new Color(accent);
          } catch (e) {
            logWarn(
              `org.gnome.desktop.interface.accent-color present but invalid: ${e}`,
            );
          }
        }
      }
    } catch (e) {
      logWarn(`Could not read org.gnome.desktop.interface.accent-color: ${e}`);
    }

    // No concrete accent color available; fall back to white
    return new Color("#FFFFFF");
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Disconnect all settings signals
    for (const connectionId of this.#signalConnections) {
      this.#settings.disconnect(connectionId);
    }
    this.#signalConnections = [];

    // Disconnect interface settings signal (if any)
    if (this.#ifaceSettings !== null && this.#ifaceSignalConnection !== null) {
      try {
        this.#ifaceSettings.disconnect(this.#ifaceSignalConnection);
      } catch (e) {
        logWarn(`Failed to disconnect ifaceSettings signal: ${e}`);
      }
      this.#ifaceSignalConnection = null;
    }
    this.#ifaceSettings = null;
    // Clear all targets
    this.#targets.clear();
  }

  // Private methods

  /**
   * Connect to settings changes to automatically update styles
   */
  #connectToSettings(): void {
    const colorSettings = [
      SettingsKey.COLOR_MODE,
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
   * Connect to org.gnome.desktop.interface settings so we can watch for
   * accent-color changes and update targets live (so users don't have to
   * log out/in when they change their accent color).
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
   * Get the current style configuration from settings
   */
  #getCurrentStyleConfig(): StyleConfig {
    const dividerPreset = this.#settings.get_enum(SettingsKey.DIVIDER_PRESET);
    const customDividerText = this.#settings.get_string(
      SettingsKey.CUSTOM_DIVIDER_TEXT,
    );
    const colorMode = this.#settings.get_enum(SettingsKey.COLOR_MODE);

    let clockColor: Color;
    let dateColor: Color;
    let dividerColor: Color;

    if (colorMode === 1) {
      // Accent color mode
      const accentColor = this.getAccentColor();
      clockColor = accentColor.lighten(0.8);
      dateColor = accentColor;
      // Use a darkened version of the accent color for the divider so it remains
      // distinct when accent color is selected.
      dividerColor = accentColor.lighten(0.8);
      logInfo(
        `Using accent color for clock and date, darkened for divider: ${accentColor} ${accentColor}`,
      );
    } else if (colorMode === 2) {
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
      // Default mode (0)
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

  /**
   * Apply current styles to a specific target
   */
  #applyCurrentStyles(target: StyleTarget): void {
    this.applyStyles(target);
  }
}
