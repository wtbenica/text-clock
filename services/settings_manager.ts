/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Service responsible for managing extension settings
 *
 * This service centralizes all GSettings operations and provides
 * a clean interface for accessing and monitoring settings changes.
 */

import Gio from "gi://Gio";
import GObject from "gi://GObject";
import { SETTINGS } from "../constants/index.js";
import SettingsKey from "../models/settings-keys";
import { logInfo, logWarn, logErr } from "../utils/error-utils.js";
import { fuzzinessFromEnumIndex } from "../utils/fuzziness-utils.js";
import { Fuzziness } from "../clock_formatter.js";

/**
 * Callback function for settings changes
 */
export type SettingsChangeCallback = (
  newValue: any,
  key: SettingsKey | string,
) => void;

/**
 * Settings change subscription
 */
interface SettingsSubscription {
  key: SettingsKey | string;
  connectionId: number;
  callback: SettingsChangeCallback;
}

/**
 * Service for managing extension settings
 */
export class SettingsManager {
  #settings: Gio.Settings;
  #subscriptions: SettingsSubscription[] = [];

  constructor(settings: Gio.Settings) {
    this.#settings = settings;
    logInfo("SettingsManager initialized");
  }

  /**
   * Get a boolean setting value
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
   * Set a boolean setting value
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
   * Get a string setting value
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
   * Set a string setting value
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
   * Get an enum setting value (returns the index)
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
   * Set an enum setting value
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
   * Get the fuzziness setting as a Fuzziness enum value
   */
  getFuzziness(): Fuzziness {
    const fuzzIndex = this.getEnum(SettingsKey.FUZZINESS, 1); // Default to 5 minutes
    return fuzzinessFromEnumIndex(fuzzIndex);
  }

  /**
   * Bind a GObject property to a settings key
   */
  bindProperty(
    settingsKey: SettingsKey | string,
    object: GObject.Object,
    propertyName: string,
    flags: Gio.SettingsBindFlags = Gio.SettingsBindFlags.DEFAULT,
  ): void {
    try {
      this.#settings.bind(settingsKey, object, propertyName, flags);
      logInfo(`Bound setting "${settingsKey}" to property "${propertyName}"`);
    } catch (error) {
      logErr(
        `Failed to bind setting "${settingsKey}" to property "${propertyName}": ${error}`,
      );
    }
  }

  /**
   * Subscribe to changes for a specific setting
   */
  subscribe(
    key: SettingsKey | string,
    callback: SettingsChangeCallback,
  ): () => void {
    try {
      const connectionId = this.#settings.connect(`changed::${key}`, () => {
        const newValue = this.#getSettingValue(key);
        callback(newValue, key);
      });

      const subscription: SettingsSubscription = {
        key,
        connectionId,
        callback,
      };

      this.#subscriptions.push(subscription);
      logInfo(`Subscribed to setting "${key}" changes`);

      // Return unsubscribe function
      return () => this.#unsubscribe(subscription);
    } catch (error) {
      logErr(`Failed to subscribe to setting "${key}": ${error}`);
      return () => {}; // Return no-op function
    }
  }

  /**
   * Subscribe to multiple settings changes
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
          changes[k] = this.#getSettingValue(k);
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
   * Get all current setting values as an object
   */
  getAllSettings(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.values(SETTINGS)) {
      result[key] = this.#getSettingValue(key);
    }

    return result;
  }

  /**
   * Reset a setting to its default value
   */
  resetSetting(key: SettingsKey | string): boolean {
    try {
      this.#settings.reset(key);
      logInfo(`Reset setting "${key}" to default value`);
      return true;
    } catch (error) {
      logErr(`Failed to reset setting "${key}": ${error}`);
      return false;
    }
  }

  /**
   * Check if a setting key exists in the schema
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
   * Clean up all subscriptions and resources
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
    logInfo("SettingsManager destroyed");
  }

  // Private methods

  /**
   * Get a setting value using the appropriate method based on its type
   */
  #getSettingValue(key: SettingsKey | string): any {
    try {
      // We need to determine the type of the setting
      // This is a simplified approach - in a more robust implementation,
      // we might want to use the schema to determine the exact type

      // Try different types based on common setting patterns
      const schema = this.#settings.settings_schema;
      if (!schema) {
        logWarn(`No schema found for settings`);
        return undefined;
      }

      const schemaKey = schema.get_key(key as string);
      if (!schemaKey) {
        logWarn(`No schema key found for "${key}"`);
        return undefined;
      }

      const typeString = schemaKey.get_value_type().dup_string();

      switch (typeString) {
        case "b": // boolean
          return this.#settings.get_boolean(key);
        case "s": // string
          return this.#settings.get_string(key);
        case "i": // integer/enum
          return this.#settings.get_enum(key);
        default:
          logWarn(`Unknown setting type "${typeString}" for key "${key}"`);
          return undefined;
      }
    } catch (error) {
      logWarn(`Failed to get value for setting "${key}": ${error}`);
      return undefined;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  #unsubscribe(subscription: SettingsSubscription): void {
    try {
      this.#settings.disconnect(subscription.connectionId);

      const index = this.#subscriptions.indexOf(subscription);
      if (index > -1) {
        this.#subscriptions.splice(index, 1);
      }

      logInfo(`Unsubscribed from setting "${subscription.key}" changes`);
    } catch (error) {
      logErr(
        `Failed to unsubscribe from setting "${subscription.key}": ${error}`,
      );
    }
  }
}
