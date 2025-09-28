// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import SettingsKey from "../../domain/models/settings_keys.js";

describe("Constants and Configuration", () => {
  describe("Settings Constants", () => {
    it("should have all required settings constants", () => {
      expect(SettingsKey.SHOW_DATE).toBeDefined();
      expect(SettingsKey.SHOW_WEEKDAY).toBeDefined();
      expect(SettingsKey.FUZZINESS).toBeDefined();
      expect(SettingsKey.TIME_FORMAT).toBeDefined();
    });

    it("should have string values for settings keys", () => {
      expect(typeof SettingsKey.SHOW_DATE).toBe("string");
      expect(typeof SettingsKey.SHOW_WEEKDAY).toBe("string");
      expect(typeof SettingsKey.FUZZINESS).toBe("string");
      expect(typeof SettingsKey.TIME_FORMAT).toBe("string");
    });

    it("should have non-empty settings keys", () => {
      expect(SettingsKey.SHOW_DATE.length).toBeGreaterThan(0);
      expect(SettingsKey.SHOW_WEEKDAY.length).toBeGreaterThan(0);
      expect(SettingsKey.FUZZINESS.length).toBeGreaterThan(0);
      expect(SettingsKey.TIME_FORMAT.length).toBeGreaterThan(0);
    });
  });

  describe("Error Messages", () => {
    it("should have error constants available", () => {
      const { Errors } = require("../../infrastructure/constants/index.js");

      expect(Errors).toBeDefined();
      expect(typeof Errors).toBe("object");
    });
  });
});
