// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  RELEASE_MESSAGES,
  getNotificationTitle,
  generateUpdateMessage,
} from "../constants/release_messages.js";
import SettingsKey from "../models/settings_keys.js";
import { extensionGettext } from "../utils/gettext/gettext_utils_ext.js";

/**
 * Finds the latest release message that hasn't been seen yet.
 *
 * This function sorts available release versions in descending order and
 * returns the latest version that:
 * - Is at or below the current version (no future versions)
 * - Is newer than the last seen version
 *
 * @param currentVersion - The current extension version
 * @param lastSeen - The last version for which the user saw a notification
 * @returns The version to show a notification for, or null if none found
 *
 * @example
 * ```typescript
 * // User is on v1.1.0, last saw v1.0.5
 * findLatestUnseenRelease("1.1.0", "1.0.5"); // Returns "1.1.0"
 *
 * // User is on v1.1.0, already saw v1.1.0
 * findLatestUnseenRelease("1.1.0", "1.1.0"); // Returns null
 * ```
 */
export function findLatestUnseenRelease(
  currentVersion: string,
  lastSeen: string,
): string | null {
  const availableVersions = Object.keys(RELEASE_MESSAGES).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
    const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  for (const version of availableVersions) {
    if (version <= currentVersion && (!lastSeen || version > lastSeen)) {
      return version;
    }
  }
  return null;
}

export function maybeShowUpdateNotification({
  settingsManager,
  notificationService,
  metadata,
  openPreferences,
}: {
  settingsManager: any;
  notificationService: any;
  metadata: any;
  openPreferences: () => void;
}) {
  const currentVersionName: string =
    metadata["version-name"] || String(metadata.version || "");

  if (!currentVersionName) {
    return;
  }

  const lastSeen = settingsManager.getString(SettingsKey.LAST_SEEN_VERSION);
  const notifyVersion = findLatestUnseenRelease(currentVersionName, lastSeen);

  if (!notifyVersion) {
    return;
  }

  const isFirstInstall = !lastSeen || lastSeen === "";

  const title = getNotificationTitle(
    currentVersionName,
    extensionGettext,
    isFirstInstall,
  );
  const body = generateUpdateMessage(
    notifyVersion,
    extensionGettext,
    isFirstInstall,
  );

  notificationService.showUpdateNotification(title, body, openPreferences);

  settingsManager.setString(SettingsKey.LAST_SEEN_VERSION, currentVersionName);
}
