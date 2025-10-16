// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Helper utilities for the preferences UI.
 */

import Adw from "gi://Adw";
import Gio from "gi://Gio";
// @ts-ignore
import * as Config from "resource:///org/gnome/Shell/Extensions/js/misc/config.js";

import { logErr, logWarn } from "../../utils/error_utils.js";
import { prefsGettext } from "../../utils/gettext/gettext_utils_prefs.js";

/**
 * Bind a Gio.Settings key to a property on an ActionRow-like widget.
 *
 * @param widget - widget that exposes the property to bind
 * @param settings - Gio.Settings instance
 * @param settingKey - the key to bind
 * @param property - the widget property name
 */
export function bindSettingsToProperty(
  widget: Adw.ActionRow,
  settings: Gio.Settings,
  settingKey: string,
  property: string,
) {
  try {
    settings!.bind(settingKey, widget, property, Gio.SettingsBindFlags.DEFAULT);
  } catch (error: any) {
    logErr(
      error,
      `${prefsGettext._("Error binding settings for")} ${widget.title}`,
    );
  }
}

export function getShellVersion(): number {
  const shellVersion = parseFloat(Config.PACKAGE_VERSION);

  if (!Number.isNaN(shellVersion)) return Math.floor(shellVersion);

  logWarn("Could not detect GNOME Shell version, assuming 45");
  return 45;
}

// Core UI utilities still in use
export {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
} from "./components/groups.js";
