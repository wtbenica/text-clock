import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../utils/gettext/index.js";
import { logErr, logWarn, logInfo } from "../utils/error_utils.js";
import { parseGnomeShellVersionString } from "../utils/parse/index.js";
import { createTranslatePackGetter } from "../utils/translate/index.js";

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
      const outStr = out.toString();
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

export function getAdwaitaVersion(): number | null {
  try {
    const anyAdw: any = Adw as any;

    if (typeof anyAdw.get_major_version === "function") {
      const major = Number(anyAdw.get_major_version());
      if (!Number.isNaN(major)) {
        logInfo(`Detected libadwaita major version: ${major}`);
        return major;
      }
    }

    if (typeof anyAdw.get_version === "function") {
      const ver = String(anyAdw.get_version());
      const m = ver.match(/(\d+)\./);
      if (m) {
        const major = Number(m[1]);
        if (!Number.isNaN(major)) {
          logInfo(`Detected libadwaita major version: ${major}`);
          return major;
        }
      }
    }

    const candidates = [anyAdw.version, anyAdw.VERSION, anyAdw.__version__];
    for (const c of candidates) {
      if (!c) continue;
      const s = String(c);
      const m = s.match(/(\d+)\./);
      if (m) {
        const major = Number(m[1]);
        if (!Number.isNaN(major)) {
          logInfo(`Detected libadwaita major version: ${major}`);
          return major;
        }
      }
    }
  } catch (e) {
    logWarn(`Error detecting libadwaita version: ${e}`);
  }

  logWarn("Could not detect libadwaita version");
  return null;
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
