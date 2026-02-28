/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Manages extension settings with type safety and error handling.
 *
 * Provides a clean interface for GSettings operations including getters,
 * setters, reactive subscriptions, and automatic cleanup.
 */

import Gio from "gi://Gio";
import GObject from "gi://GObject";

import { Fuzziness } from "../core/clock_formatter.js";
import SettingsKey from "../models/settings_keys.js";
import { logErr, logWarn } from "../utils/error_utils.js";
import { fuzzinessFromEnumIndex } from "../utils/parse_utils.js";

/** Default to 5-minute fuzziness */
const DEFAULT_FUZZINESS_INDEX = 1;

/** Mapping from keys to types for validation */
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

/** Callback invoked when a setting changes. */
export type SettingsChangeCallback = (
  newValue: any,
  key: SettingsKey | string,
) => void;

/** Internal subscription tracking. */
interface SettingsSubscription {
  /** The settings key being monitored */
  key: SettingsKey | string;

  /** GObject connection ID for the signal handler */
  connectionId: number;

  /** User callback to invoke when the setting changes */
  callback: SettingsChangeCallback;
}

/**
 * Manages extension settings with type safety and reactive updates.
 *
 * Provides getters/setters, subscriptions, property binding, and cleanup.
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
   * Get a boolean setting value.
   *
   * @returns Boolean value or defaultValue on error
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
   * Set a boolean setting value.
   *
   * @returns true on success, false on error
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
   * Get a string setting value.
   *
   * @returns String value or defaultValue on error
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
   * Set a string setting value.
   *
   * @returns true on success, false on error
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
   * Get an enum setting value (integer index).
   *
   * @returns Enum index or defaultValue on error
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
   * Set an enum setting value.
   *
   * @param value - Enum index (must match schema values)
   * @returns true on success, false on error
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
   * Get fuzziness as a typed Fuzziness enum.
   *
   * @returns Current fuzziness (defaults to FIVE_MINUTES)
   */
  getFuzziness(): Fuzziness {
    const fuzzIndex = this.getEnum(
      SettingsKey.FUZZINESS,
      DEFAULT_FUZZINESS_INDEX,
    ); // Default to 5 minutes
    return fuzzinessFromEnumIndex(fuzzIndex);
  }

  /**
   * Bind a GObject property to a settings key for automatic sync.
   *
   * Creates two-way binding: setting changes update the property and vice versa.
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
   * Subscribe to changes for a specific setting.
   *
   * @returns Unsubscribe function to stop listening
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
