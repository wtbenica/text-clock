// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

// Mock GNOME modules before importing the service
jest.mock("gi://GLib", () => ({}), { virtual: true });
jest.mock("resource:///org/gnome/shell/ui/main.js", () => ({}), {
  virtual: true,
});
jest.mock("resource:///org/gnome/shell/ui/messageTray.js", () => ({}), {
  virtual: true,
});

// Mock the error utils
jest.mock("../../../utils/error_utils.js", () => ({
  logErr: jest.fn(),
  logWarn: jest.fn(),
}));

// Mock the gettext utils
jest.mock("../../../utils/gettext/gettext_utils_ext.js", () => ({
  extensionGettext: {
    _: (str: string) => str,
  },
}));

import { NotificationService } from "../../../services/notification_service.js";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService("Test Extension");
  });

  describe("formatBulletList", () => {
    it("should format items with default bullet character", () => {
      const items = ["First item", "Second item", "Third item"];
      const result = service.formatBulletList(items);

      expect(result).toBe("• First item\n• Second item\n• Third item");
    });

    it("should format items with custom bullet character", () => {
      const items = ["Alpha", "Beta", "Gamma"];
      const result = service.formatBulletList(items, "-");

      expect(result).toBe("- Alpha\n- Beta\n- Gamma");
    });

    it("should handle single item", () => {
      const items = ["Only one"];
      const result = service.formatBulletList(items);

      expect(result).toBe("• Only one");
    });

    it("should handle empty array", () => {
      const items: string[] = [];
      const result = service.formatBulletList(items);

      expect(result).toBe("");
    });

    it("should handle items with special characters", () => {
      const items = ["Item with 'quotes'", 'Item with "double quotes"'];
      const result = service.formatBulletList(items);

      expect(result).toBe(
        "• Item with 'quotes'\n• Item with \"double quotes\"",
      );
    });

    it("should work with various unicode bullet characters", () => {
      const items = ["Test"];

      expect(service.formatBulletList(items, "•")).toBe("• Test");
      expect(service.formatBulletList(items, "◦")).toBe("◦ Test");
      expect(service.formatBulletList(items, "▪")).toBe("▪ Test");
      expect(service.formatBulletList(items, "▸")).toBe("▸ Test");
    });
  });

  describe("formatNotificationWithList", () => {
    it("should format with intro text and bullet list", () => {
      const intro = "New features:";
      const items = ["Feature A", "Feature B"];
      const result = service.formatNotificationWithList(intro, items);

      expect(result).toBe("New features:\n• Feature A\n• Feature B");
    });

    it("should format without intro text when null", () => {
      const items = ["Item 1", "Item 2"];
      const result = service.formatNotificationWithList(null, items);

      expect(result).toBe("• Item 1\n• Item 2");
    });

    it("should use custom bullet character", () => {
      const intro = "Updates:";
      const items = ["Update 1", "Update 2"];
      const result = service.formatNotificationWithList(intro, items, "-");

      expect(result).toBe("Updates:\n- Update 1\n- Update 2");
    });

    it("should handle empty intro string", () => {
      const intro = "";
      const items = ["Item"];
      const result = service.formatNotificationWithList(intro, items);

      // Empty string is falsy, so intro is not included
      expect(result).toBe("• Item");
    });

    it("should handle single item with intro", () => {
      const intro = "Important:";
      const items = ["Critical update"];
      const result = service.formatNotificationWithList(intro, items);

      expect(result).toBe("Important:\n• Critical update");
    });

    it("should handle multiple items", () => {
      const intro = "Version 2.0:";
      const items = [
        "New color themes",
        "Performance improvements",
        "Bug fixes",
        "Updated translations",
      ];
      const result = service.formatNotificationWithList(intro, items);

      expect(result).toBe(
        "Version 2.0:\n• New color themes\n• Performance improvements\n• Bug fixes\n• Updated translations",
      );
    });

    it("should preserve spacing in items", () => {
      const intro = "Features:";
      const items = ["Item with  double  spaces", "  Leading spaces"];
      const result = service.formatNotificationWithList(intro, items);

      expect(result).toBe(
        "Features:\n• Item with  double  spaces\n•   Leading spaces",
      );
    });
  });

  describe("constructor", () => {
    it("should create service with given extension name", () => {
      const customService = new NotificationService("My Custom Extension");
      expect(customService).toBeInstanceOf(NotificationService);
    });

    it("should handle extension names with special characters", () => {
      const customService = new NotificationService("Extension™ v2.0");
      expect(customService).toBeInstanceOf(NotificationService);
    });
  });

  describe("destroy", () => {
    it("should not throw when called", () => {
      expect(() => service.destroy()).not.toThrow();
    });

    it("should be callable multiple times without error", () => {
      service.destroy();
      expect(() => service.destroy()).not.toThrow();
    });
  });
});
