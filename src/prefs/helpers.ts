import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../utils/gettext/gettext_utils_prefs.js";
import { logErr, logWarn } from "../utils/error_utils.js";
import { parseGnomeShellVersionString } from "../utils/parse_utils.js";
import { createTranslatePackGetter } from "../utils/translate/translate_pack_utils.js";

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

// Version utilities (merged from version.ts)
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

// Re-exports for UI and page helpers
export {
  createAndAddPageToWindow,
  createAndAddGroupToPage,
} from "./ui/groups.js";
export { addComboRow, addSwitchRow, addEntryRowBinding } from "./ui/rows.js";
export {
  createColorControlWidget,
  createColorRow,
} from "./pages/color_page/color_controls.js";
export {
  addColorModeRow,
  addClockColorRow,
  addDateColorRow,
  addDividerColorRow,
} from "./pages/color_page/index.js";
export {
  getTimeFormatsList,
  addTimeFormatComboRow,
} from "./pages/general_page/formatters.js";
export {
  addShowDateSwitchRow,
  addShowWeekdaySwitchRow,
  createFuzzinessComboRow,
  addDividerPresetRow,
} from "./pages/general_page/index.js";
