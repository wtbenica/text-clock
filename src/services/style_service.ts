/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Manages extension styles and colors with reactive updates.
 *
 * Handles color modes (default/accent/custom), system accent color integration,
 * divider text, and automatic updates to registered UI targets.
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

/**
 * Manages styles and colors with reactive updates.
 *
 * Automatically applies colors based on current mode and settings.
 * Registered UI components update automatically when settings change.
 */
export class StyleService {
  #settings: Gio.Settings;
  #targets: Set<StyleTarget> = new Set();
  #signalConnections: number[] = [];
  #ifaceSettings: Gio.Settings | null = null;
  #ifaceSignalConnection: number | null = null;

  // Cache for the last known accent color to avoid redundant reads
  #accentColorName: string | null = null;
  #accentColor: Color | null = null;

  /**
   * Create a new StyleService instance.
   *
   * @param settings - The extension's GSettings instance for monitoring style changes
   */
  constructor(settings: Gio.Settings) {
    this.#settings = settings;
    this.#connectToSettings();
    this.#connectToInterfaceSettings();
  }

  /**
   * Register a target to receive automatic style updates.
   *
   * Current styles are applied immediately upon registration.
   *
   * @param target - UI component implementing the StyleTarget interface
   */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.#applyCurrentStyles(target);
  }

  /**
   * Unregister a target from receiving automatic style updates.
   *
   * Called when UI components are destroyed to prevent memory leaks.
   *
   * @param target - The previously registered StyleTarget to remove
   */
  unregisterTarget(target: StyleTarget): void {
    this.#targets.delete(target);
  }

  /**
   * Apply styles to a specific target.
   *
   * @param target - The StyleTarget to update
   * @param config - Optional style configuration; uses current settings if not provided
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
   * Apply current styles to all registered targets.
   *
   * Called automatically when settings change.
   */
  applyToAllTargets(): void {
    const config = this.#getCurrentStyleConfig();
    for (const target of this.#targets) {
      this.applyStyles(target, config);
    }
  }

  /**
   * Get the current style configuration.
   *
   * @returns StyleConfig with colors and divider text from current settings
   */
  getCurrentStyles(): StyleConfig {
    return this.#getCurrentStyleConfig();
  }

  /**
   * Get the system's current accent color.
   *
   * Reads from GNOME desktop interface settings. Maps named colors (e.g., 'blue')
   * to hex values. Falls back to white if unavailable.
   *
   * @returns System accent color or white fallback
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
          if (accent === this.#accentColorName && this.#accentColor) {
            return this.#accentColor;
          }
          this.#accentColorName = accent;

          // If the accent is a named token (e.g. "yellow"), map it to a hex value.
          const mapped = accentNameToHex(accent);
          if (mapped) {
            try {
              this.#accentColor = new Color(mapped);
              return this.#accentColor;
            } catch (e) {
              logWarn(`Mapped accent color invalid: ${e}`);
            }
          }

          // Otherwise try constructing Color directly (may throw if not concrete)
          try {
            this.#accentColor = new Color(accent);
            return this.#accentColor;
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

    // No concrete accent color available; cache and return white fallback
    if (this.#accentColorName !== "fallback" || !this.#accentColor) {
      this.#accentColorName = "fallback";
      this.#accentColor = new Color("#FFFFFF");
    }
    return this.#accentColor;
  }

  /**
   * Clean up resources and prevent memory leaks.
   *
   * Disconnects all settings signal handlers and clears registered targets.
   * This method must be called when the StyleService is no longer needed,
   * particularly when the extension is disabled, to prevent memory leaks
   * and orphaned signal handlers in the GNOME Shell environment.
   *
   * After calling destroy(), the StyleService instance should not be used.
   *
   * @example
   * ```typescript
   * class TextClockExtension extends Extension {
   *   private styleService: StyleService;
   *
   *   disable() {
   *     // Always cleanup StyleService to prevent leaks
   *     this.styleService.destroy();
   *   }
   * }
   * ```
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

    // Clear accent color cache
    this.#accentColorName = null;
    this.#accentColor = null;

    // Clear all targets
    this.#targets.clear();
  }

  // Private methods

  /**
   * Connect to all style-related settings changes for automatic updates.
   *
   * Establishes signal handlers for all settings that affect styling:
   * color mode, accent style, individual colors, divider settings, and
   * per-element accent overrides. When any of these settings change,
   * all registered targets are automatically updated.
   */
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
   * Connect to GNOME's desktop interface settings for live accent color updates.
   *
   * Establishes a connection to org.gnome.desktop.interface to monitor
   * accent-color changes. This allows the extension to update immediately
   * when users change their system accent color, without requiring a logout
   * or extension restart.
   *
   * Gracefully handles cases where the interface settings are not available.
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
          // Invalidate accent color cache when system accent changes
          this.#accentColorName = null;
          this.#accentColor = null;

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
   * Build the complete style configuration from current settings.
   *
   * Reads all relevant settings and applies the complex color mode logic
   * to determine the final colors for each UI element. Handles:
   * - Default mode: white for all elements
   * - Accent mode: applies selected accent style variation
   * - Custom mode: individual colors with optional per-element accent overrides
   *
   * @returns Complete StyleConfig with resolved colors and divider text
   */
  #getCurrentStyleConfig(): StyleConfig {
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

  /**
   * Apply current settings-based styles to a specific target.
   *
   * Convenience method that reads current style configuration and
   * applies it to the specified target.
   *
   * @param target - The StyleTarget to receive current styles
   */
  #applyCurrentStyles(target: StyleTarget): void {
    this.applyStyles(target);
  }
}
