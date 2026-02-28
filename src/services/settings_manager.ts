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
        callback(undefined, key);
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
