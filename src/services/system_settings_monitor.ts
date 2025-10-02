/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gio from "gi://Gio";

import SettingsKey from "../models/settings_keys.js";
import { logWarn, logErr } from "../utils/error_utils.js";

/**
 * Service that mirrors selected GNOME desktop clock settings into the
 * extension's own settings. This keeps the extension in sync with
 * `org.gnome.desktop.interface` for the date/weekday display toggles.
 *
 * The service is read-first: it prefers values from the system settings
 * and writes those values into the provided extension settings instance.
 * It listens for changes on the system keys and applies them to the
 * extension settings so the rest of the extension (which reads the
 * extension schema) continues to work with minimal changes.
 */
export class SystemSettingsMonitor {
  #systemSettings: Gio.Settings | null = null;
  #extensionSettings: Gio.Settings;
  #connDate: number | null = null;
  #connWeekday: number | null = null;
  #stopped = true;

  /**
   * Create a SystemSettingsMonitor instance.
   *
   * @param extensionSettings - The extension's Gio.Settings instance to update
   */
  constructor(extensionSettings: Gio.Settings) {
    this.#extensionSettings = extensionSettings;

    try {
      this.#systemSettings = new Gio.Settings({
        schema: "org.gnome.desktop.interface",
      });
    } catch (e) {
      logWarn(`org.gnome.desktop.interface schema not available: ${e}`);
      this.#systemSettings = null;
    }
  }

  /** Start syncing (connects signals and applies initial values). */
  start() {
    if (this.#stopped === false) return;
    this.#stopped = false;

    if (!this.#systemSettings) return;

    // Apply initial values from system into extension settings
    this.#applySystemValues();

    // Subscribe to changes
    try {
      this.#connDate = this.#systemSettings.connect(
        "changed::clock-show-date",
        () => this.#applySystemValues(),
      );

      this.#connWeekday = this.#systemSettings.connect(
        "changed::clock-show-weekday",
        () => this.#applySystemValues(),
      );
    } catch (e) {
      logWarn(`Failed to connect to system clock settings: ${e}`);
    }
  }

  /** Stop syncing (disconnects signals). */
  stop() {
    if (this.#stopped === true) return;
    this.#stopped = true;

    if (!this.#systemSettings) return;

    try {
      if (this.#connDate !== null) {
        this.#systemSettings.disconnect(this.#connDate);
        this.#connDate = null;
      }
      if (this.#connWeekday !== null) {
        this.#systemSettings.disconnect(this.#connWeekday);
        this.#connWeekday = null;
      }
    } catch (e) {
      logWarn(`Error disconnecting system settings signals: ${e}`);
    }
  }

  /** Apply current system values to the extension settings. */
  #applySystemValues() {
    if (!this.#systemSettings) return;

    try {
      const sysShowDate = this.#systemSettings.get_boolean("clock-show-date");
      const sysShowWeekday =
        this.#systemSettings.get_boolean("clock-show-weekday");

      // Write into extension settings; failures are non-fatal
      try {
        this.#extensionSettings.set_boolean(SettingsKey.SHOW_DATE, sysShowDate);
      } catch (e) {
        logErr(
          `Failed to set extension setting ${SettingsKey.SHOW_DATE}: ${e}`,
        );
      }

      try {
        this.#extensionSettings.set_boolean(
          SettingsKey.SHOW_WEEKDAY,
          sysShowWeekday,
        );
      } catch (e) {
        logErr(
          `Failed to set extension setting ${SettingsKey.SHOW_WEEKDAY}: ${e}`,
        );
      }
    } catch (e) {
      logWarn(`Failed to read system clock settings: ${e}`);
    }
  }
}

export default SystemSettingsMonitor;
