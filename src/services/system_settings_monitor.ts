/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gio from "gi://Gio";

import SettingsKey from "../models/settings_keys";
import { logWarn } from "../utils/error_utils.js";

/**
 * Mirrors GNOME desktop clock settings into extension settings.
 *
 * Syncs date/weekday display toggles from `org.gnome.desktop.interface`
 * to the extension, keeping them in sync with system preferences.
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
    this.#connDate = this.#systemSettings.connect(
      "changed::clock-show-date",
      () => this.#applySystemValues(),
    );

    this.#connWeekday = this.#systemSettings.connect(
      "changed::clock-show-weekday",
      () => this.#applySystemValues(),
    );
  }

  /** Stop syncing (disconnects signals). */
  stop() {
    if (this.#stopped === true) return;
    this.#stopped = true;

    if (!this.#systemSettings) return;

    if (this.#connDate !== null) {
      this.#systemSettings.disconnect(this.#connDate);
      this.#connDate = null;
    }
    if (this.#connWeekday !== null) {
      this.#systemSettings.disconnect(this.#connWeekday);
      this.#connWeekday = null;
    }
  }

  /** Apply current system values to extension settings. */
  #applySystemValues() {
    if (!this.#systemSettings) return;

    const sysShowDate = this.#systemSettings.get_boolean("clock-show-date");
    const sysShowWeekday =
      this.#systemSettings.get_boolean("clock-show-weekday");

    this.#extensionSettings.set_boolean(SettingsKey.SHOW_DATE, sysShowDate);

    this.#extensionSettings.set_boolean(
      SettingsKey.SHOW_WEEKDAY,
      sysShowWeekday,
    );
  }
}

export default SystemSettingsMonitor;
