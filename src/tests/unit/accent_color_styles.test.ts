/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Tests for accent color style variations.
 */

import { Color } from "../../models/color.js";
import {
  ACCENT_COLOR_STYLE_NAMES,
  ACCENT_COLOR_STYLE_DESCRIPTIONS,
} from "../../constants/index.js";
import {
  ACCENT_STYLE_CONFIGS,
  getAccentStyleConfig,
  applyAccentStyle,
} from "../../services/accent_style_config.js";

describe("AccentColorStyles", () => {
  describe("ACCENT_COLOR_STYLE_NAMES", () => {
    it("should have style names", () => {
      expect(ACCENT_COLOR_STYLE_NAMES.length).toBeGreaterThan(0);
    });

    it("should match configuration names", () => {
      const configNames = ACCENT_STYLE_CONFIGS.map((config) => config.name);
      expect(ACCENT_COLOR_STYLE_NAMES).toEqual(configNames);
    });

    it("should have consistent mapping with configurations", () => {
      ACCENT_COLOR_STYLE_NAMES.forEach((name, index) => {
        expect(ACCENT_STYLE_CONFIGS[index]).toBeDefined();
        expect(ACCENT_STYLE_CONFIGS[index].name).toBe(name);
      });
    });
  });

  describe("ACCENT_COLOR_STYLE_DESCRIPTIONS", () => {
    it("should have same length as names", () => {
      expect(ACCENT_COLOR_STYLE_DESCRIPTIONS).toHaveLength(
        ACCENT_COLOR_STYLE_NAMES.length,
      );
    });

    it("should match configuration descriptions", () => {
      const configDescriptions = ACCENT_STYLE_CONFIGS.map(
        (config) => config.description,
      );
      expect(ACCENT_COLOR_STYLE_DESCRIPTIONS).toEqual(configDescriptions);
    });

    it("should have consistent mapping with configurations", () => {
      ACCENT_COLOR_STYLE_DESCRIPTIONS.forEach((description, index) => {
        expect(ACCENT_STYLE_CONFIGS[index]).toBeDefined();
        expect(ACCENT_STYLE_CONFIGS[index].description).toBe(description);
      });
    });
  });

  describe("ACCENT_STYLE_CONFIGS", () => {
    it("should have configurations", () => {
      expect(ACCENT_STYLE_CONFIGS.length).toBeGreaterThan(0);
    });

    it("should have all required properties", () => {
      ACCENT_STYLE_CONFIGS.forEach((config) => {
        expect(config).toHaveProperty("name");
        expect(config).toHaveProperty("description");
        expect(config).toHaveProperty("clockColor");
        expect(config).toHaveProperty("dateColor");
        expect(config).toHaveProperty("dividerColor");
        expect(typeof config.clockColor).toBe("function");
        expect(typeof config.dateColor).toBe("function");
        expect(typeof config.dividerColor).toBe("function");
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
      });
    });
  });

  describe("getAccentStyleConfig", () => {
    it("should return valid config for valid indices", () => {
      for (let i = 0; i < ACCENT_STYLE_CONFIGS.length; i++) {
        const config = getAccentStyleConfig(i);
        expect(config).toBe(ACCENT_STYLE_CONFIGS[i]);
      }
    });

    it("should return first config for invalid indices", () => {
      expect(getAccentStyleConfig(-1)).toBe(ACCENT_STYLE_CONFIGS[0]);
      expect(getAccentStyleConfig(999)).toBe(ACCENT_STYLE_CONFIGS[0]);
    });
  });

  describe("applyAccentStyle", () => {
    const testColor = new Color("#3584E4"); // GNOME Blue

    it("should apply first style (index 0) correctly", () => {
      const result = applyAccentStyle(testColor, 0);
      const config = ACCENT_STYLE_CONFIGS[0];

      expect(result.clockColor).toEqual(config.clockColor(testColor));
      expect(result.dateColor).toEqual(config.dateColor(testColor));
      expect(result.dividerColor).toEqual(config.dividerColor(testColor));
    });

    it("should apply all configured styles correctly", () => {
      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        const result = applyAccentStyle(testColor, index);

        expect(result.clockColor).toEqual(config.clockColor(testColor));
        expect(result.dateColor).toEqual(config.dateColor(testColor));
        expect(result.dividerColor).toEqual(config.dividerColor(testColor));
      });
    });

    it("should return valid Color objects", () => {
      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        const result = applyAccentStyle(testColor, index);

        expect(result.clockColor).toBeInstanceOf(Color);
        expect(result.dateColor).toBeInstanceOf(Color);
        expect(result.dividerColor).toBeInstanceOf(Color);

        // Should be valid hex colors
        expect(result.clockColor.toString()).toMatch(/^#[0-9A-F]{6}$/);
        expect(result.dateColor.toString()).toMatch(/^#[0-9A-F]{6}$/);
        expect(result.dividerColor.toString()).toMatch(/^#[0-9A-F]{6}$/);
      });
    });

    it("should fallback to first config for invalid indices", () => {
      const validResult = applyAccentStyle(testColor, 0);
      const invalidResult = applyAccentStyle(testColor, 999);

      expect(invalidResult.clockColor.toString()).toBe(
        validResult.clockColor.toString(),
      );
      expect(invalidResult.dateColor.toString()).toBe(
        validResult.dateColor.toString(),
      );
      expect(invalidResult.dividerColor.toString()).toBe(
        validResult.dividerColor.toString(),
      );
    });

    it("should handle multiple test colors consistently", () => {
      const colors = [
        new Color("#3584E4"), // Blue
        new Color("#E62D42"), // Red
        new Color("#3A944A"), // Green
      ];

      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        colors.forEach((color) => {
          const result = applyAccentStyle(color, index);
          const expectedResult = {
            clockColor: config.clockColor(color),
            dateColor: config.dateColor(color),
            dividerColor: config.dividerColor(color),
          };

          expect(result.clockColor.toString()).toBe(
            expectedResult.clockColor.toString(),
          );
          expect(result.dateColor.toString()).toBe(
            expectedResult.dateColor.toString(),
          );
          expect(result.dividerColor.toString()).toBe(
            expectedResult.dividerColor.toString(),
          );
        });
      });
    });
  });

  describe("Color variations", () => {
    const testColor = new Color("#3584E4"); // GNOME Blue

    it("should create lighter variants", () => {
      const lighter = testColor.lighten(0.3);
      expect(lighter.toString()).not.toBe(testColor.toString());
      // Should be a valid hex color
      expect(lighter.toString()).toMatch(/^#[0-9A-F]{6}$/);
    });

    it("should create darker variants", () => {
      const darker = testColor.darken(0.2);
      expect(darker.toString()).not.toBe(testColor.toString());
      // Should be a valid hex color
      expect(darker.toString()).toMatch(/^#[0-9A-F]{6}$/);
    });

    it("should handle different lightening amounts", () => {
      const light1 = testColor.lighten(0.3);
      const light2 = testColor.lighten(0.5);
      expect(light1.toString()).not.toBe(light2.toString());
    });

    it("should maintain Color instance types", () => {
      const lighter = testColor.lighten(0.3);
      const darker = testColor.darken(0.2);

      expect(lighter).toBeInstanceOf(Color);
      expect(darker).toBeInstanceOf(Color);
    });
  });
});
