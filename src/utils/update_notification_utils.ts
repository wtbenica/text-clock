import {
  RELEASE_MESSAGES,
  getNotificationTitle,
  generateUpdateMessage,
} from "../constants/release_messages.js";
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

  const lastSeen = settingsManager.getString("LAST_SEEN_VERSION");
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

  settingsManager.setString("LAST_SEEN_VERSION", currentVersionName);
}
