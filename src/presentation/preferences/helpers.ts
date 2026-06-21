// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Helper utilities for the preferences UI.
 */

// @ts-ignore
import * as Config from "resource:///org/gnome/Shell/Extensions/js/misc/config.js";

import { logWarn } from "../../utils/error_utils.js";

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
