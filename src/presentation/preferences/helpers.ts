import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { logErr, logWarn } from "../../infrastructure/utils/error_utils.js";
import { prefsGettext } from "../../infrastructure/utils/gettext/gettext_utils_prefs.js";
import { parseGnomeShellVersionString } from "../../infrastructure/utils/parse_utils.js";
import { createTranslatePackGetter } from "../../infrastructure/utils/translate/translate_pack_utils.js";

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

// TRANSLATE PACK — prefs-scoped translate pack getter
export const TRANSLATE_PACK = createTranslatePackGetter(prefsGettext);

// Version utilities
// GNOME Shell imports for version detection (may not exist in all contexts)
declare const imports: any;

export function getShellVersion(): number {
  try {
    const versionString = GLib.getenv("GNOME_SHELL_VERSION");
    const parsed = parseGnomeShellVersionString(versionString as any);
    if (!Number.isNaN(parsed)) return parsed;
  } catch (e) {
    logWarn(`Error reading GNOME_SHELL_VERSION env: ${e}`);
  }

  try {
    const [ok, out] = GLib.spawn_command_line_sync("gnome-shell --version");
    if (ok && out) {
      // Use GLib.ByteArray to properly convert Uint8Array to string
      const outStr = imports.byteArray.toString(out);
      const parsed = parseGnomeShellVersionString(outStr);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch (e) {
    logWarn(`Could not run 'gnome-shell --version': ${e}`);
  }

  try {
    if (typeof imports !== "undefined" && imports.misc && imports.misc.config) {
      const Config = imports.misc.config;
      const apiVersion = Config.LIBMUTTER_API_VERSION;
      if (typeof apiVersion === "number") {
        const shellVersion = apiVersion + 35;
        return shellVersion;
      }
    }
  } catch (error) {
    logWarn(
      `Failed to detect GNOME Shell version from imports.misc.config: ${error}`,
    );
  }

  logWarn("Could not detect GNOME Shell version, assuming 45");
  return 45;
}

// Core UI utilities still in use
export {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
} from "./components/groups.js";
