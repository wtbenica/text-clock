/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Type-safe wrapper for extension GSettings.
 *
 * Handles subscriptions and cleanup automatically.
 */

import Gio from "gi://Gio";
import GObject from "gi://GObject";

import type { Fuzziness } from "../core/clock_formatter.js";
import SettingsKey from "../models/settings_keys.js";
import { logErr, logWarn } from "../utils/error_utils.js";
import { fuzzinessFromEnumIndex } from "../utils/parse_utils.js";

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

/** Type-safe GSettings wrapper with subscriptions and cleanup. */
export class SettingsManager {
  #settings: Gio.Settings;
  #subscriptions: SettingsSubscription[] = [];

  /**
   * @param settings - GSettings instance from Extension.getSettings()
   */
  constructor(settings: Gio.Settings) {
    this.#settings = settings;
  }

  /**
   * Get a boolean setting value.
   */
  getBoolean(key: SettingsKey | string): boolean {
    return this.#settings.get_boolean(key);
  }

  /**
   * Set a boolean setting value.
   */
  setBoolean(key: SettingsKey | string, value: boolean): boolean {
    return this.#settings.set_boolean(key, value);
  }

  /**
   * Get a string setting value.
   */
  getString(key: SettingsKey | string): string {
    return this.#settings.get_string(key);
  }

  /**
   * Set a string setting value.
   */
  setString(key: SettingsKey | string, value: string): boolean {
    return this.#settings.set_string(key, value);
  }

  /**
   * Get an enum setting value (integer index).
   */
  getEnum(key: SettingsKey | string): number {
    return this.#settings.get_enum(key);
  }

  /**
   * Set an enum setting value.
   *
   * @param value - Enum index (must match schema values)
   */
  setEnum(key: SettingsKey | string, value: number): boolean {
    return this.#settings.set_enum(key, value);
  }

  /**
   * Get fuzziness as a typed Fuzziness enum.
   */
  getFuzziness(): Fuzziness {
    const fuzzIndex = this.getEnum(SettingsKey.FUZZINESS);
    return fuzzinessFromEnumIndex(fuzzIndex);
  }

  /** Bind GObject property to setting for two-way automatic sync. */
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
   * Subscribe to setting changes.
   * @returns Unsubscribe function
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

  /** Disconnect all subscriptions to prevent memory leaks. Call when extension is disabled. */
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

  /** Unsubscribe from specific subscription (called by subscription cleanup functions). */
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
