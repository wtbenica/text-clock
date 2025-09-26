import GLib from "gi://GLib";
import { logWarn } from "../utils/error_utils.js";
import { parseGnomeShellVersionString } from "../utils/parse/index.js";

// GNOME Shell imports for version detection (may not exist in all contexts)
declare const imports: any;

/**
 * Attempt to detect the running GNOME Shell major version.
 *
 * The function attempts multiple strategies in order:
 *  - environment variable GNOME_SHELL_VERSION
 *  - running `gnome-shell --version`
 *  - inspecting `imports.misc.config.LIBMUTTER_API_VERSION` when available
 *
 * If detection fails, it warns and returns a sensible default (45).
 *
 * @returns number - detected GNOME Shell major version (e.g. 45, 47)
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
