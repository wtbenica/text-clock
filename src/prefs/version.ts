import GLib from "gi://GLib";
import Adw from "gi://Adw";
import { logInfo, logWarn } from "../utils/error_utils.js";
import { parseGnomeShellVersionString } from "../utils/parse/index.js";

// GNOME Shell imports for version detection (may not exist in all contexts)
declare const imports: any;

/**
 * Attempt to detect the running GNOME Shell major version.
 *
 * Strategies:
 *  - environment variable GNOME_SHELL_VERSION
 *  - running `gnome-shell --version`
 *  - inspecting `imports.misc.config.LIBMUTTER_API_VERSION` when available
 */
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

/**
 * Attempt to detect the installed Libadwaita (Adwaita) major version.
 *
 * Strategies used (in order):
 *  - call Adw.get_major_version() if available
 *  - call Adw.get_version() and parse the major component
 *  - inspect Adw.version / Adw.VERSION / Adw.__version__ if present
 */
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

export default { getShellVersion, getAdwaitaVersion };
