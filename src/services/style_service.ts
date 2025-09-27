/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Service responsible for managing extension styles and colors.
 *
 * This service centralizes all color and style-related operations, providing
 * a reactive system for applying styles to UI elements. It manages the complex
 * interactions between different color modes (default, accent, custom) and
 * automatically updates registered UI targets when settings change.
 *
 * The StyleService handles:
 * - Color mode switching (default, accent with variations, custom colors)
 * - System accent color integration with live updates
 * - Per-element accent color overrides in custom mode
 * - Divider text management with presets and custom text
 * - Automatic target registration and cleanup
 *
 * @example
 * ```typescript
 * const styleService = new StyleService(settings);
 *
 * // Register a UI component to receive style updates
 * styleService.registerTarget(clockLabel);
 *
 * // Get current colors
 * const colors = styleService.getCurrentStyles();
 * console.log('Clock color:', colors.clockColor?.toString());
 *
 * // Clean up
 * styleService.destroy();
 * ```
 */

import Gio from "gi://Gio";
import { normalizeColor } from "../utils/color/color_utils.js";
import { accentNameToHex } from "../utils/color/accent_color_utils.js";
import { logWarn } from "../utils/error_utils.js";
import { getDividerText } from "../constants/index.js";
import SettingsKey from "../models/settings_keys.js";
import { Color } from "../models/color.js";
import { applyAccentStyle } from "./accent_style_config.js";

/**
 * Configuration object for styling UI elements.
 *
 * Represents a complete set of style properties that can be applied
 * to UI targets. All properties are optional to allow partial updates.
 */
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

/**
 * Interface for objects that can receive style updates from the StyleService.
 *
 * UI components implement this interface to be automatically updated when
 * style settings change. The StyleService will call these methods to apply
 * new colors and text content.
 */
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
 * Service for managing styles and colors throughout the extension with reactive updates.
 *
 * The StyleService provides a centralized, reactive system for managing all visual
 * styling in the text-clock extension. It automatically applies the correct colors
 * based on the current color mode and settings, and updates all registered UI
 * components when settings change.
 *
 * Key features:
 * - Automatic target registration and style application
 * - Reactive updates when settings change (no manual refresh needed)
 * - Support for multiple color modes: default, accent (with variations), custom
 * - System accent color integration with live monitoring
 * - Per-element accent overrides in custom mode
 * - Divider text management with presets and custom options
 * - Graceful error handling and fallbacks
 *
 * @example
 * ```typescript
 * const styleService = new StyleService(extension.getSettings());
 *
 * // Register UI components for automatic updates
 * styleService.registerTarget(clockWidget);
 * styleService.registerTarget(dateWidget);
 *
 * // Get current style state
 * const styles = styleService.getCurrentStyles();
 * console.log(`Using colors: ${styles.clockColor}, ${styles.dateColor}`);
 *
 * // Colors will update automatically when user changes settings
 * // No manual intervention needed
 *
 * // Cleanup when extension is disabled
 * styleService.destroy();
 * ```
 */
export class StyleService {
  #settings: Gio.Settings;
  #targets: Set<StyleTarget> = new Set();
  #signalConnections: number[] = [];
  #ifaceSettings: Gio.Settings | null = null;
  #ifaceSignalConnection: number | null = null;

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
   * Once registered, the target will automatically receive style updates
   * whenever relevant settings change. The current styles are applied
   * immediately upon registration.
   *
   * @param target - UI component implementing the StyleTarget interface
   *
   * @example
   * ```typescript
   * // Clock widget will automatically update when color settings change
   * styleService.registerTarget(clockWidget);
   *
   * // Multiple targets can be registered
   * styleService.registerTarget(dateWidget);
   * styleService.registerTarget(dividerWidget);
   * ```
   */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.#applyCurrentStyles(target);
  }

  /**
   * Unregister a target from receiving automatic style updates.
   *
   * The target will no longer receive style updates when settings change.
   * This should be called when UI components are destroyed to prevent
   * memory leaks and avoid errors from updating destroyed components.
   *
   * @param target - The previously registered StyleTarget to remove
   *
   * @example
   * ```typescript
   * // Stop updating this widget when it's destroyed
   * styleService.unregisterTarget(clockWidget);
   * ```
   */
  unregisterTarget(target: StyleTarget): void {
    this.#targets.delete(target);
  }

  /**
   * Apply styles to a specific target using custom or current configuration.
   *
   * Applies the specified style configuration to a single target. If no
   * configuration is provided, uses the current settings-based configuration.
   *
   * @param target - The StyleTarget to update
   * @param config - Optional style configuration; uses current settings if not provided
   *
   * @example
   * ```typescript
   * // Apply current settings-based styles
   * styleService.applyStyles(clockWidget);
   *
   * // Apply custom style configuration
   * const customStyles: StyleConfig = {
   *   clockColor: new Color('#FF0000'),
   *   dateColor: new Color('#00FF00'),
   *   dividerText: ' ↔ '
   * };
   * styleService.applyStyles(clockWidget, customStyles);
   * ```
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
   * Reads the current style configuration from settings and applies it to
   * every registered target. This is called automatically when settings
   * change, but can also be called manually to force a style refresh.
   *
   * @example
   * ```typescript
   * // Force all targets to refresh their styles
   * styleService.applyToAllTargets();
   * ```
   */
  applyToAllTargets(): void {
    const config = this.#getCurrentStyleConfig();
    for (const target of this.#targets) {
      this.applyStyles(target, config);
    }
  }

  /**
   * Get the current style configuration derived from extension settings.
   *
   * Returns the complete style configuration based on current settings,
   * including the resolved colors for the active color mode and the
   * appropriate divider text.
   *
   * @returns StyleConfig object with current colors and divider text
   *
   * @example
   * ```typescript
   * const styles = styleService.getCurrentStyles();
   * console.log('Current clock color:', styles.clockColor?.toString());
   * console.log('Divider text:', styles.dividerText);
   *
   * // Use for manual styling or debugging
   * if (styles.clockColor?.isLight()) {
   *   console.log('Using light clock color');
   * }
   * ```
   */
  getCurrentStyles(): StyleConfig {
    return this.#getCurrentStyleConfig();
  }

  /**
   * Validate and normalize a color value with fallback support.
   *
   * Ensures a color string is valid and normalized to a consistent format.
   * If the color is invalid, logs a warning and returns the fallback value.
   *
   * @param color - The color string to validate (hex, rgb, named colors)
   * @param fallback - Color to return if validation fails (default: white)
   * @returns Normalized color string that is guaranteed to be valid
   *
   * @example
   * ```typescript
   * const validColor = styleService.validateColor('#3584E4'); // '#3584E4'
   * const fallbackColor = styleService.validateColor('invalid', '#FF0000'); // '#FF0000'
   * const defaultFallback = styleService.validateColor('bad-color'); // '#FFFFFF'
   * ```
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
   * Get the system's current accent color with comprehensive fallback handling.
   *
   * Attempts to read the user's selected accent color from GNOME's desktop
   * interface settings. Handles both named accent colors (e.g., 'blue', 'red')
   * and direct color values. Falls back gracefully to white if the accent
   * color cannot be determined.
   *
   * This method is called automatically when accent color mode is active and
   * when the system accent color changes.
   *
   * @returns Color object representing the system accent color or white fallback
   *
   * @example
   * ```typescript
   * const accent = styleService.getAccentColor();
   * console.log('System accent color:', accent.toString()); // '#3584E4' (GNOME Blue)
   *
   * // Use in custom styling logic
   * const lighterAccent = accent.lighten(0.2);
   * const contrastColor = accent.isLight() ? '#000000' : '#FFFFFF';
   * ```
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

      // Use the configuration system to apply the selected accent style
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
