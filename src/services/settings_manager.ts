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

import { Fuzziness } from "../core/clock_formatter.js";
import SettingsKey from "../models/settings_keys";
import { fuzzinessFromEnumIndex } from "../utils/parse_utils.js";

/** Callback invoked when a setting changes. */
export type SettingsChangeCallback = (
  newValue: any,
  key: SettingsKey | string,
) => void;

/** Type-safe GSettings wrapper with subscriptions and cleanup. */
export class SettingsManager {
  #settings: Gio.Settings;
  #connectionIds: number[] = [];

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

  /**
   * Subscribe to setting changes.
   * @returns Unsubscribe function
   */
  subscribe(key: SettingsKey | string, callback: SettingsChangeCallback) {
    const connectionId = this.#settings.connect(`changed::${key}`, () => {
      callback(undefined, key);
    });

    this.#connectionIds.push(connectionId);
  }

  /** Disconnect all subscriptions to prevent memory leaks. Call when extension is disabled. */
  destroy(): void {
    // Disconnect all subscriptions
    for (const connectionId of this.#connectionIds) {
      this.#settings.disconnect(connectionId);
    }

    this.#connectionIds = [];
  }
}
