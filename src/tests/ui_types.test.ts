// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { CLOCK_LABEL_PROPERTIES } from "../domain/types/ui.js";

describe("UI Types", () => {
  describe("CLOCK_LABEL_PROPERTIES", () => {
    it("should define expected clock label property constants", () => {
      expect(CLOCK_LABEL_PROPERTIES.SHOW_DATE).toBe("show-date");
      expect(CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE).toBe("clock-update");
      expect(CLOCK_LABEL_PROPERTIES.TRANSLATE_PACK).toBe("translate-pack");
      expect(CLOCK_LABEL_PROPERTIES.FUZZINESS).toBe("fuzzy-minutes");
      expect(CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY).toBe("show-weekday");
      expect(CLOCK_LABEL_PROPERTIES.TIME_FORMAT).toBe("time-format");
    });

    it("should have all required properties", () => {
      expect(Object.keys(CLOCK_LABEL_PROPERTIES)).toHaveLength(6);
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("SHOW_DATE");
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("CLOCK_UPDATE");
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("TRANSLATE_PACK");
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("FUZZINESS");
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("SHOW_WEEKDAY");
      expect(CLOCK_LABEL_PROPERTIES).toHaveProperty("TIME_FORMAT");
    });

    it("should have consistent kebab-case property values", () => {
      const values = Object.values(CLOCK_LABEL_PROPERTIES);
      values.forEach((value) => {
        expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });
  });
});
