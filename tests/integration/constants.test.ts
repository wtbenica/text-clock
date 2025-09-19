// SPDX-FileCopyrightText: 2025 2024 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { SETTINGS } from "../../constants/index.js";

describe("Constants and Configuration", () => {
  describe("Settings Constants", () => {
    it("should have all required settings constants", () => {
      expect(SETTINGS.SHOW_DATE).toBeDefined();
      expect(SETTINGS.SHOW_WEEKDAY).toBeDefined();
      expect(SETTINGS.FUZZINESS).toBeDefined();
      expect(SETTINGS.TIME_FORMAT).toBeDefined();
    });

    it("should have string values for settings keys", () => {
      expect(typeof SETTINGS.SHOW_DATE).toBe("string");
      expect(typeof SETTINGS.SHOW_WEEKDAY).toBe("string");
      expect(typeof SETTINGS.FUZZINESS).toBe("string");
      expect(typeof SETTINGS.TIME_FORMAT).toBe("string");
    });

    it("should have non-empty settings keys", () => {
      expect(SETTINGS.SHOW_DATE.length).toBeGreaterThan(0);
      expect(SETTINGS.SHOW_WEEKDAY.length).toBeGreaterThan(0);
      expect(SETTINGS.FUZZINESS.length).toBeGreaterThan(0);
      expect(SETTINGS.TIME_FORMAT.length).toBeGreaterThan(0);
    });
  });

  describe("Error Messages", () => {
    it("should have error constants available", () => {
      const { Errors } = require("../../constants/index.js");

      expect(Errors).toBeDefined();
      expect(typeof Errors).toBe("object");
    });
  });
});
