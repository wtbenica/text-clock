// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Helper utilities for the preferences UI.
 */

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import * as Config from "resource:///org/gnome/shell/misc/config.js";

import { logErr, logWarn } from "../../utils/error_utils.js";
import { prefsGettext } from "../../utils/gettext/gettext_utils_prefs.js";
import { createTranslatePackGetter } from "../../utils/translate/translate_pack_utils.js";

/**
 * Extract major version number from GNOME Shell version string.
 */
function parseGnomeShellVersionString(
  input: string | null | undefined,
): number {
  if (!input) return NaN;
  const s = String(input).trim();
  const re = /(?:GNOME Shell\s*)?(\d+)(?:\.|\b)/i;
  const m = s.match(re);
  if (!m) return NaN;
  const major = parseInt(m[1], 10);
  return Number.isNaN(major) ? NaN : major;
}

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

export const TRANSLATE_PACK = createTranslatePackGetter(prefsGettext);

declare const imports: any;

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
