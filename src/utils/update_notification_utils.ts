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

function findLatestUnseenRelease(
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
