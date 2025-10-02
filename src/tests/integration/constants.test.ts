// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import SettingsKey from "../../models/settings_keys.js";

describe("Constants and Configuration", () => {
  describe("Settings Keys", () => {
    it("should have all required settings keys for core functionality", () => {
      // Test that essential settings keys exist - these are critical for extension operation
      expect(SettingsKey.SHOW_DATE).toBe("show-date");
      expect(SettingsKey.SHOW_WEEKDAY).toBe("show-weekday");
      expect(SettingsKey.FUZZINESS).toBe("fuzziness");
      expect(SettingsKey.TIME_FORMAT).toBe("time-format");
    });

    it("should have all color-related settings keys", () => {
      // Ensure color settings match GSettings schema keys
      expect(SettingsKey.COLOR_MODE).toBe("color-mode");
      expect(SettingsKey.CLOCK_COLOR).toBe("clock-color");
      expect(SettingsKey.DATE_COLOR).toBe("date-color");
      expect(SettingsKey.DIVIDER_COLOR).toBe("divider-color");
    });

    it("should not have duplicate values", () => {
      // Ensure no two settings keys have the same GSettings key value
      // Test specific keys instead of using Object.values() which doesn't work with const enums
      const keys = [
        SettingsKey.SHOW_DATE,
        SettingsKey.SHOW_WEEKDAY,
        SettingsKey.FUZZINESS,
        SettingsKey.TIME_FORMAT,
        SettingsKey.COLOR_MODE,
        SettingsKey.CLOCK_COLOR,
        SettingsKey.DATE_COLOR,
        SettingsKey.DIVIDER_COLOR,
        SettingsKey.CLOCK_USE_ACCENT,
        SettingsKey.DATE_USE_ACCENT,
        SettingsKey.DIVIDER_USE_ACCENT,
        SettingsKey.DIVIDER_PRESET,
        SettingsKey.CUSTOM_DIVIDER_TEXT,
        SettingsKey.ACCENT_COLOR_STYLE,
        SettingsKey.LAST_SEEN_VERSION,
      ];
      const uniqueValues = new Set(keys);
      expect(uniqueValues.size).toBe(keys.length);
    });
  });
});
