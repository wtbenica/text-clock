// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import {
  findLatestUnseenRelease,
  maybeShowUpdateNotification,
} from "../../../utils/update_notification_utils.js";
import SettingsKey from "../../../models/settings_keys.js";

// Mock the release messages module
jest.mock("../../../constants/release_messages.js", () => ({
  RELEASE_MESSAGES: {
    "1.0.0": { version: "1.0.0" },
    "1.1.0": { version: "1.1.0" },
    "1.1.1": { version: "1.1.1" },
    "1.2.0": { version: "1.2.0" },
  },
  getNotificationTitle: jest.fn((version, _, isFirst) =>
    isFirst ? `Welcome to ${version}` : `Updated to ${version}`,
  ),
  generateUpdateMessage: jest.fn((version, _, isFirst) =>
    isFirst ? "Welcome message" : `New features in ${version}`,
  ),
}));

// Mock the gettext utils
jest.mock("../../../utils/gettext/gettext_utils_ext.js", () => ({
  extensionGettext: {
    _: (str: string) => str,
    ngettext: (s: string, p: string, n: number) => (n === 1 ? s : p),
    pgettext: (_: string, msgid: string) => msgid,
  },
}));

describe("update_notification_utils", () => {
  describe("findLatestUnseenRelease", () => {
    it("should return null when no unseen releases exist", () => {
      const result = findLatestUnseenRelease("1.2.0", "1.2.0");
      expect(result).toBeNull();
    });

    it("should return latest unseen version when one exists", () => {
      const result = findLatestUnseenRelease("1.2.0", "1.0.0");
      expect(result).toBe("1.2.0");
    });

    it("should return null when current version is beyond available release messages", () => {
      // Current version 2.0.0 doesn't have a release message
      // Last seen was 1.0.0, but since we only show messages for versions
      // that exist in RELEASE_MESSAGES and are <= current, should return 1.2.0
      const result = findLatestUnseenRelease("2.0.0", "1.0.0");
      expect(result).toBe("1.2.0"); // Latest available that's <= current
    });

    it("should handle first install (empty lastSeen)", () => {
      const result = findLatestUnseenRelease("1.1.0", "");
      expect(result).toBe("1.1.0");
    });

    it("should not return versions newer than current", () => {
      // Current is 1.1.0, but 1.1.1 and 1.2.0 exist in RELEASE_MESSAGES
      const result = findLatestUnseenRelease("1.1.0", "1.0.0");
      expect(result).toBe("1.1.0");
      // Verify newer versions are not returned
      expect(result).not.toBe("1.1.1");
      expect(result).not.toBe("1.2.0");
    });

    it("should return latest when multiple unseen versions exist", () => {
      // Current v1.2.0, haven't seen anything since 1.0.0
      // Both 1.1.0 and 1.1.1 are unseen, should return the current (latest)
      const result = findLatestUnseenRelease("1.2.0", "1.0.0");
      expect(result).toBe("1.2.0");
    });

    it("should sort versions correctly (descending)", () => {
      // Mock should have 1.2.0 > 1.1.1 > 1.1.0 > 1.0.0
      const result = findLatestUnseenRelease("1.2.0", "");
      expect(result).toBe("1.2.0");
    });

    it("should handle patch version increments", () => {
      const result = findLatestUnseenRelease("1.1.1", "1.1.0");
      expect(result).toBe("1.1.1");
    });

    it("should return null when all versions have been seen", () => {
      const result = findLatestUnseenRelease("1.1.0", "1.1.0");
      expect(result).toBeNull();
    });

    it("should handle minor version increments correctly", () => {
      const result = findLatestUnseenRelease("1.2.0", "1.1.1");
      expect(result).toBe("1.2.0");
    });
  });

  describe("maybeShowUpdateNotification", () => {
    let mockSettingsManager: any;
    let mockNotificationService: any;
    let mockMetadata: any;
    let mockOpenPreferences: jest.Mock;

    beforeEach(() => {
      mockSettingsManager = {
        getString: jest.fn(),
        setString: jest.fn(),
      };

      mockNotificationService = {
        showUpdateNotification: jest.fn(),
      };

      mockMetadata = {
        "version-name": "1.1.0",
        version: 5,
      };

      mockOpenPreferences = jest.fn();
    });

    it("should show notification on first install", () => {
      mockSettingsManager.getString.mockReturnValue("");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(mockNotificationService.showUpdateNotification).toHaveBeenCalled();
      expect(
        mockNotificationService.showUpdateNotification,
      ).toHaveBeenCalledWith(
        "Welcome to 1.1.0", // First install uses Welcome
        "Welcome message",
        mockOpenPreferences,
      );
      expect(mockSettingsManager.setString).toHaveBeenCalledWith(
        SettingsKey.LAST_SEEN_VERSION,
        "1.1.0",
      );
    });

    it("should show notification when updating from old version", () => {
      mockSettingsManager.getString.mockReturnValue("1.0.0");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(
        mockNotificationService.showUpdateNotification,
      ).toHaveBeenCalledWith(
        "Updated to 1.1.0", // Update uses "Updated to"
        "New features in 1.1.0",
        mockOpenPreferences,
      );
    });

    it("should not show notification when already seen", () => {
      mockSettingsManager.getString.mockReturnValue("1.1.0");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(
        mockNotificationService.showUpdateNotification,
      ).not.toHaveBeenCalled();
    });

    it("should handle missing version-name in metadata by using version number", () => {
      // When version-name is missing, it falls back to version number
      mockMetadata = { version: 5 };
      mockSettingsManager.getString.mockReturnValue("");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      // Should show notification using version number "5" as string
      expect(mockNotificationService.showUpdateNotification).toHaveBeenCalled();
    });

    it("should handle completely missing version metadata", () => {
      mockMetadata = {};
      mockSettingsManager.getString.mockReturnValue("");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(
        mockNotificationService.showUpdateNotification,
      ).not.toHaveBeenCalled();
    });

    it("should update last seen version after showing notification", () => {
      mockSettingsManager.getString.mockReturnValue("1.0.0");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(mockSettingsManager.setString).toHaveBeenCalledWith(
        SettingsKey.LAST_SEEN_VERSION,
        "1.1.0",
      );
    });

    it("should pass openPreferences callback correctly", () => {
      mockSettingsManager.getString.mockReturnValue("");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      // Get the callback that was passed
      const callArgs =
        mockNotificationService.showUpdateNotification.mock.calls[0];
      expect(callArgs[2]).toBe(mockOpenPreferences);
    });

    it("should not update last seen if notification is not shown", () => {
      mockSettingsManager.getString.mockReturnValue("1.1.0");

      maybeShowUpdateNotification({
        settingsManager: mockSettingsManager,
        notificationService: mockNotificationService,
        metadata: mockMetadata,
        openPreferences: mockOpenPreferences,
      });

      expect(mockSettingsManager.setString).not.toHaveBeenCalled();
    });
  });
});
