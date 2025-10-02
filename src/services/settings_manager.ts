/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Service responsible for managing extension settings.
 *
 * This service centralizes all GSettings operations and provides a clean, type-safe
 * interface for accessing and monitoring settings changes. It handles all the
 * complexities of GSettings interaction including error handling, type conversion,
 * subscriptions, and cleanup.
 *
 * The SettingsManager provides both synchronous access to current values and
 * reactive subscription patterns for responding to settings changes.
 *
 * @example
 * ```typescript
 * const settingsManager = new SettingsManager(settings);
 *
 * // Get current values
 * const showDate = settingsManager.getBoolean(SettingsKey.SHOW_DATE);
 * const clockColor = settingsManager.getString(SettingsKey.CLOCK_COLOR);
 *
 * // Subscribe to changes
 * const unsubscribe = settingsManager.subscribe(SettingsKey.SHOW_DATE, (newValue) => {
 *   console.log('Show date changed to:', newValue);
 * });
 *
 * // Cleanup
 * settingsManager.destroy();
 * ```
 */

import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { Fuzziness } from "../core/clock_formatter.js";
import SettingsKey from "../domain/models/settings_keys.js";
import { logErr, logWarn } from "../utils/error_utils.js";
import { fuzzinessFromEnumIndex } from "../utils/parse_utils.js";

/** Default enum index for 5 minutes fuzziness */
const DEFAULT_FUZZINESS_INDEX = 1;

/** Mapping from setting keys to their types */
const SETTING_TYPES = {
  [SettingsKey.SHOW_DATE]: "boolean",
  [SettingsKey.SHOW_WEEKDAY]: "boolean",
  [SettingsKey.TIME_FORMAT]: "string",
  [SettingsKey.FUZZINESS]: "enum",
  [SettingsKey.COLOR_MODE]: "enum",
  [SettingsKey.ACCENT_COLOR_STYLE]: "enum",
  [SettingsKey.CLOCK_COLOR]: "string",
  [SettingsKey.DATE_COLOR]: "string",
  [SettingsKey.DIVIDER_COLOR]: "string",
  [SettingsKey.CLOCK_USE_ACCENT]: "boolean",
  [SettingsKey.DATE_USE_ACCENT]: "boolean",
  [SettingsKey.DIVIDER_USE_ACCENT]: "boolean",
  [SettingsKey.DIVIDER_PRESET]: "enum",
  [SettingsKey.CUSTOM_DIVIDER_TEXT]: "string",
  [SettingsKey.LAST_SEEN_VERSION]: "string",
} as const;

/**
 * Callback function for settings changes.
 *
 * Called whenever a subscribed setting value changes. The callback receives
 * the new value and the setting key that changed.
 *
 * @param newValue - The new value of the setting (type depends on setting)
 * @param key - The settings key that changed
 */
export type SettingsChangeCallback = (
  newValue: any,
  key: SettingsKey | string,
) => void;

/**
 * Internal representation of a settings change subscription.
 *
 * Tracks the connection ID, callback function, and key for each active
 * subscription. Used internally for cleanup and management.
 */
interface SettingsSubscription {
  /** The settings key being monitored */
  key: SettingsKey | string;

  /** GObject connection ID for the signal handler */
  connectionId: number;

  /** User callback to invoke when the setting changes */
  callback: SettingsChangeCallback;
}

/**
 * Service for managing extension settings with type safety and error handling.
 *
 * Provides a comprehensive interface for GSettings operations including:
 * - Type-safe getters and setters for common setting types
 * - Reactive subscriptions to setting changes
 * - Property binding for GObject integration
 * - Automatic cleanup and resource management
 * - Graceful error handling with logging
 *
 * The service maintains internal subscriptions and provides cleanup methods
 * to prevent memory leaks in GNOME Shell extensions.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const manager = new SettingsManager(extension.getSettings());
 *
 * // Get settings
 * const showDate = manager.getBoolean(SettingsKey.SHOW_DATE, false);
 * const timeFormat = manager.getEnum(SettingsKey.TIME_FORMAT, 0);
 *
 * // Set settings
 * manager.setBoolean(SettingsKey.SHOW_WEEKDAY, true);
 * manager.setString(SettingsKey.DIVIDER_PRESET, '|');
 *
 * // Subscribe to changes
 * const cleanup = manager.subscribe(SettingsKey.COLOR_MODE, (newMode) => {
 *   updateClockColors(newMode);
 * });
 *
 * // Always cleanup
 * manager.destroy();
 * ```
 */
export class SettingsManager {
  #settings: Gio.Settings;
  #subscriptions: SettingsSubscription[] = [];

  /**
   * Create a new settings manager instance.
   *
   * @param settings - The GSettings instance to manage (typically from Extension.getSettings())
   */
  constructor(settings: Gio.Settings) {
    this.#settings = settings;
  }

  /**
   * Get a boolean setting value with error handling.
   *
   * @param key - The settings key to retrieve
   * @param defaultValue - Value to return if retrieval fails or key doesn't exist
   * @returns The boolean value from settings, or defaultValue if operation fails
   *
   * @example
   * ```typescript
   * const showDate = manager.getBoolean(SettingsKey.SHOW_DATE, false);
   * const showWeekday = manager.getBoolean('show-weekday', true);
   * ```
   */
  getBoolean(
    key: SettingsKey | string,
    defaultValue: boolean = false,
  ): boolean {
    try {
      return this.#settings.get_boolean(key);
    } catch (error) {
      logWarn(`Failed to get boolean setting "${key}": ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set a boolean setting value with error handling.
   *
   * @param key - The settings key to modify
   * @param value - The new boolean value to set
   * @returns true if the operation succeeded, false if it failed
   *
   * @example
   * ```typescript
   * const success = manager.setBoolean(SettingsKey.SHOW_DATE, true);
   * if (!success) console.log('Failed to update show-date setting');
   * ```
   */
  setBoolean(key: SettingsKey | string, value: boolean): boolean {
    try {
      return this.#settings.set_boolean(key, value);
    } catch (error) {
      logErr(`Failed to set boolean setting "${key}" to ${value}: ${error}`);
      return false;
    }
  }

  /**
   * Get a string setting value with error handling.
   *
   * @param key - The settings key to retrieve
   * @param defaultValue - Value to return if retrieval fails or key doesn't exist
   * @returns The string value from settings, or defaultValue if operation fails
   *
   * @example
   * ```typescript
   * const clockColor = manager.getString(SettingsKey.CLOCK_COLOR, '#FFFFFF');
   * const divider = manager.getString('divider-preset', '|');
   * ```
   */
  getString(key: SettingsKey | string, defaultValue: string = ""): string {
    try {
      return this.#settings.get_string(key);
    } catch (error) {
      logWarn(`Failed to get string setting "${key}": ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set a string setting value with error handling.
   *
   * @param key - The settings key to modify
   * @param value - The new string value to set
   * @returns true if the operation succeeded, false if it failed
   *
   * @example
   * ```typescript
   * const success = manager.setString(SettingsKey.CLOCK_COLOR, '#3584E4');
   * manager.setString('custom-divider-text', ' → ');
   * ```
   */
  setString(key: SettingsKey | string, value: string): boolean {
    try {
      return this.#settings.set_string(key, value);
    } catch (error) {
      logErr(`Failed to set string setting "${key}" to "${value}": ${error}`);
      return false;
    }
  }

  /**
   * Get an enum setting value with error handling.
   *
   * Returns the integer index of the selected enum value from the GSettings schema.
   *
   * @param key - The settings key to retrieve
   * @param defaultValue - Index value to return if retrieval fails or key doesn't exist
   * @returns The enum index from settings, or defaultValue if operation fails
   *
   * @example
   * ```typescript
   * const timeFormat = manager.getEnum(SettingsKey.TIME_FORMAT, 0); // 0 = Format One
   * const colorMode = manager.getEnum('color-mode', 1); // 1 = Custom
   * ```
   */
  getEnum(key: SettingsKey | string, defaultValue: number = 0): number {
    try {
      return this.#settings.get_enum(key);
    } catch (error) {
      logWarn(`Failed to get enum setting "${key}": ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set an enum setting value with error handling.
   *
   * @param key - The settings key to modify
   * @param value - The new enum index to set (must match schema enum values)
   * @returns true if the operation succeeded, false if it failed
   *
   * @example
   * ```typescript
   * const success = manager.setEnum(SettingsKey.TIME_FORMAT, 1); // Format Two
   * manager.setEnum('fuzziness', 2); // 10 minutes
   * ```
   */
  setEnum(key: SettingsKey | string, value: number): boolean {
    try {
      return this.#settings.set_enum(key, value);
    } catch (error) {
      logErr(`Failed to set enum setting "${key}" to ${value}: ${error}`);
      return false;
    }
  }

  /**
   * Get the fuzziness setting as a strongly-typed Fuzziness enum value.
   *
   * Converts the raw GSettings enum index to the corresponding Fuzziness value
   * for type safety and easier use throughout the codebase.
   *
   * @returns The current fuzziness setting, defaults to FIVE_MINUTES if retrieval fails
   *
   * @example
   * ```typescript
   * const fuzziness = manager.getFuzziness();
   * // Returns: Fuzziness.ONE_MINUTE, FIVE_MINUTES, TEN_MINUTES, or FIFTEEN_MINUTES
   *
   * if (fuzziness === Fuzziness.FIFTEEN_MINUTES) {
   *   // Handle 15-minute rounding
   * }
   * ```
   */
  getFuzziness(): Fuzziness {
    const fuzzIndex = this.getEnum(
      SettingsKey.FUZZINESS,
      DEFAULT_FUZZINESS_INDEX,
    ); // Default to 5 minutes
    return fuzzinessFromEnumIndex(fuzzIndex);
  }

  /**
   * Bind a GObject property to a settings key for automatic synchronization.
   *
   * Creates a two-way binding between a GSettings key and a GObject property.
   * When the setting changes, the property is updated automatically, and vice versa.
   * This is the standard pattern for connecting GTK widgets to settings.
   *
   * @param settingsKey - The GSettings key to bind
   * @param object - The GObject instance containing the property
   * @param propertyName - The name of the property to bind
   * @param flags - Binding behavior flags (default: bidirectional sync)
   *
   * @example
   * ```typescript
   * // Bind a switch widget to the show-date setting
   * manager.bindProperty(
   *   SettingsKey.SHOW_DATE,
   *   showDateSwitch,
   *   'active',
   *   Gio.SettingsBindFlags.DEFAULT
   * );
   *
   * // Changes to the switch will update the setting and vice versa
   * ```
   */
  bindProperty(
    settingsKey: SettingsKey | string,
    object: GObject.Object,
    propertyName: string,
    flags: Gio.SettingsBindFlags = Gio.SettingsBindFlags.DEFAULT,
  ): void {
    try {
      this.#settings.bind(settingsKey, object, propertyName, flags);
    } catch (error) {
      logErr(
        `Failed to bind setting "${settingsKey}" to property "${propertyName}": ${error}`,
      );
    }
  }

  /**
   * Subscribe to changes for a specific setting with automatic cleanup support.
   *
   * Registers a callback to be called whenever the specified setting changes.
   * The subscription is automatically managed and can be cleaned up using the
   * returned unsubscribe function or by calling destroy() on the manager.
   *
   * @param key - The settings key to monitor for changes
   * @param callback - Function to call when the setting changes
   * @returns Function to call to unsubscribe from changes
   *
   * @example
   * ```typescript
   * const unsubscribe = manager.subscribe(SettingsKey.COLOR_MODE, (newMode) => {
   *   console.log('Color mode changed to:', newMode);
   *   updateUIColors();
   * });
   *
   * // Later, stop listening for changes
   * unsubscribe();
   *
   * // Or let destroy() clean up all subscriptions
   * manager.destroy();
   * ```
   */
  subscribe(
    key: SettingsKey | string,
    callback: SettingsChangeCallback,
  ): () => void {
    try {
      const connectionId = this.#settings.connect(`changed::${key}`, () => {
        let newValue: any;

        const type = SETTING_TYPES[key as SettingsKey];
        switch (type) {
          case "boolean":
            newValue = this.getBoolean(key);
            break;
          case "string":
            newValue = this.getString(key);
            break;
          case "enum":
            newValue = this.getEnum(key);
            break;
          default:
            logWarn(`Unknown setting type for key: ${key}`);
            return;
        }

        callback(newValue, key);
      });

      const subscription: SettingsSubscription = {
        key,
        connectionId,
        callback,
      };

      this.#subscriptions.push(subscription);

      // Return unsubscribe function
      return () => this.#unsubscribe(subscription);
    } catch (error) {
      logErr(`Failed to subscribe to setting "${key}": ${error}`);
      return () => {}; // Return no-op function
    }
  }

  /**
   * Subscribe to changes for multiple settings with batch notification.
   *
   * When any of the specified settings change, the callback is invoked with
   * the current values of ALL the monitored settings. This is useful for
   * complex UI updates that depend on multiple related settings.
   *
   * @param keys - Array of settings keys to monitor
   * @param callback - Function called with all current values when any setting changes
   * @returns Function to unsubscribe from all monitored settings
   *
   * @example
   * ```typescript
   * const colorKeys = [
   *   SettingsKey.COLOR_MODE,
   *   SettingsKey.CLOCK_COLOR,
   *   SettingsKey.DATE_COLOR
   * ];
   *
   * const unsubscribe = manager.subscribeToMultiple(colorKeys, (settings) => {
   *   const { 'color-mode': mode, 'clock-color': clockColor } = settings;
   *   applyColorScheme(mode, clockColor);
   * });
   *
   * unsubscribe(); // Stop monitoring all color settings
   * ```
   */
  subscribeToMultiple(
    keys: (SettingsKey | string)[],
    callback: (changes: Record<string, any>) => void,
  ): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    for (const key of keys) {
      const unsubscribe = this.subscribe(key, () => {
        // Get all current values and call the callback
        const changes: Record<string, any> = {};
        for (const k of keys) {
          const type = SETTING_TYPES[k as SettingsKey];
          if (type) {
            switch (type) {
              case "boolean":
                changes[k] = this.getBoolean(k);
                break;
              case "string":
                changes[k] = this.getString(k);
                break;
              case "enum":
                changes[k] = this.getEnum(k);
                break;
            }
          }
        }
        callback(changes);
      });
      unsubscribeFunctions.push(unsubscribe);
    }

    // Return function that unsubscribes from all
    return () => {
      unsubscribeFunctions.forEach((fn) => fn());
    };
  }

  /**
   * Get all current setting values as a key-value object.
   *
   * Retrieves all known extension settings and returns them as an object
   * for bulk operations, debugging, or state snapshots.
   *
   * @returns Object containing all current setting values
   *
   * @example
   * ```typescript
   * const allSettings = manager.getAllSettings();
   * console.log('Current settings:', allSettings);
   * // {
   * //   'show-date': true,
   * //   'time-format': 0,
   * //   'clock-color': '#FFFFFF',
   * //   'color-mode': 1,
   * //   ...
   * // }
   * ```
   */
  getAllSettings(): Record<string, any> {
    const settings: Record<string, any> = {};

    for (const [key, type] of Object.entries(SETTING_TYPES)) {
      try {
        switch (type) {
          case "boolean":
            settings[key] = this.getBoolean(key);
            break;
          case "string":
            settings[key] = this.getString(key);
            break;
          case "enum":
            settings[key] = this.getEnum(key);
            break;
          default:
            logWarn(`Unknown setting type "${type}" for key: ${key}`);
        }
      } catch (error) {
        logWarn(`Failed to get setting "${key}": ${error}`);
      }
    }

    return settings;
  }

  /**
   * Reset a setting to its schema-defined default value.
   *
   * Restores the specified setting to its original default value as defined
   * in the GSettings schema. Useful for "Reset to Defaults" functionality.
   *
   * @param key - The settings key to reset
   * @returns true if the reset succeeded, false if it failed
   *
   * @example
   * ```typescript
   * const success = manager.resetSetting(SettingsKey.CLOCK_COLOR);
   * if (success) {
   *   console.log('Clock color reset to default');
   * }
   *
   * // Reset all color settings
   * manager.resetSetting('clock-color');
   * manager.resetSetting('date-color');
   * manager.resetSetting('divider-color');
   * ```
   */
  resetSetting(key: SettingsKey | string): boolean {
    try {
      this.#settings.reset(key);
      return true;
    } catch (error) {
      logErr(`Failed to reset setting "${key}": ${error}`);
      return false;
    }
  }

  /**
   * Check if a setting key exists in the GSettings schema.
   *
   * Validates that a settings key is defined in the schema before attempting
   * to access it. Useful for feature detection or preventing errors with
   * optional settings.
   *
   * @param key - The settings key to check for existence
   * @returns true if the key exists in the schema, false otherwise
   *
   * @example
   * ```typescript
   * if (manager.hasKey('experimental-feature')) {
   *   const enabled = manager.getBoolean('experimental-feature');
   *   console.log('Experimental feature:', enabled ? 'enabled' : 'disabled');
   * } else {
   *   console.log('Experimental feature not available in this version');
   * }
   * ```
   */
  hasKey(key: SettingsKey | string): boolean {
    try {
      return this.#settings.settings_schema?.has_key(key) ?? false;
    } catch (error) {
      logWarn(`Failed to check if setting key "${key}" exists: ${error}`);
      return false;
    }
  }

  /**
   * Clean up all subscriptions and resources to prevent memory leaks.
   *
   * Disconnects all active setting change subscriptions and clears internal
   * state. This method should always be called when the SettingsManager is
   * no longer needed, particularly important in GNOME Shell extensions to
   * prevent memory leaks and orphaned signal handlers.
   *
   * After calling destroy(), the SettingsManager instance should not be used.
   *
   * @example
   * ```typescript
   * class ExtensionManager {
   *   private settingsManager: SettingsManager;
   *
   *   disable() {
   *     // Always cleanup settings manager
   *     this.settingsManager.destroy();
   *   }
   * }
   * ```
   */
  destroy(): void {
    // Disconnect all subscriptions
    for (const subscription of this.#subscriptions) {
      try {
        this.#settings.disconnect(subscription.connectionId);
      } catch (error) {
        logWarn(
          `Failed to disconnect setting subscription for "${subscription.key}": ${error}`,
        );
      }
    }

    this.#subscriptions = [];
  }

  // Private methods

  /**
   * Unsubscribe from a specific subscription and remove it from tracking.
   *
   * Disconnects the GObject signal handler and removes the subscription from
   * the internal tracking list. Called automatically by subscription cleanup functions.
   *
   * @param subscription - The subscription object to clean up
   */
  #unsubscribe(subscription: SettingsSubscription): void {
    try {
      this.#settings.disconnect(subscription.connectionId);

      const index = this.#subscriptions.indexOf(subscription);
      if (index > -1) {
        this.#subscriptions.splice(index, 1);
      }
    } catch (error) {
      logErr(
        `Failed to unsubscribe from setting "${subscription.key}": ${error}`,
      );
    }
  }
}
