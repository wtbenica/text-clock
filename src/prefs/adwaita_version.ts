import Adw from "gi://Adw";
import { logInfo, logWarn } from "../utils/error_utils.js";

/**
 * Attempt to detect the installed Libadwaita (Adwaita) major version.
 *
 * Strategies used (in order):
 *  - call Adw.get_major_version() if available
 *  - call Adw.get_version() and parse the major component
 *  - inspect Adw.version / Adw.VERSION / Adw.__version__ if present
 *
 * Returns null when detection failed. The function logs the found
 * version (or a warning) so the prefs UI can be tested during enable.
 */
export function getAdwaitaVersion(): number | null {
  try {
    // Some versions expose a getter helper
    const anyAdw: any = Adw as any;

    if (typeof anyAdw.get_major_version === "function") {
      const major = Number(anyAdw.get_major_version());
      if (!Number.isNaN(major)) {
        logInfo(`Detected libadwaita major version: ${major}`);
        return major;
      }
    }

    // Some bindings expose get_version() returning a string like "1.6.0"
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

    // Try typical version properties
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

export default { getAdwaitaVersion };
