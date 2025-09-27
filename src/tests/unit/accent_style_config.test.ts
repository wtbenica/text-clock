/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Tests for accent style configuration system.
 */

import { Color } from "../../models/color.js";
import {
  applyAccentStyle,
  ACCENT_STYLE_CONFIGS,
  getAccentStyleConfig,
} from "../../services/accent_style_config.js";

describe("AccentStyleConfig", () => {
  const testColor = new Color("#3584E4"); // GNOME Blue

  describe("ACCENT_STYLE_CONFIGS", () => {
    it("should have at least one configuration", () => {
      expect(ACCENT_STYLE_CONFIGS.length).toBeGreaterThan(0);
    });

    it("should have valid configurations for all styles", () => {
      ACCENT_STYLE_CONFIGS.forEach((config) => {
        expect(config).toHaveProperty("name");
        expect(config).toHaveProperty("description");
        expect(config).toHaveProperty("clockColor");
        expect(config).toHaveProperty("dateColor");
        expect(config).toHaveProperty("dividerColor");
        expect(typeof config.name).toBe("string");
        expect(typeof config.description).toBe("string");
        expect(typeof config.clockColor).toBe("function");
        expect(typeof config.dateColor).toBe("function");
        expect(typeof config.dividerColor).toBe("function");
      });
    });

    it("should have consistent array mapping", () => {
      // Test that array indices map correctly to configurations
      for (let i = 0; i < ACCENT_STYLE_CONFIGS.length; i++) {
        const config = ACCENT_STYLE_CONFIGS[i];
        expect(config).toBeDefined();
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
      }
    });
  });

  describe("getAccentStyleConfig", () => {
    it("should return correct config for valid indices", () => {
      for (let i = 0; i < ACCENT_STYLE_CONFIGS.length; i++) {
        const config = getAccentStyleConfig(i);
        expect(config).toBe(ACCENT_STYLE_CONFIGS[i]);
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
      }
    });

    it("should return first config for invalid negative index", () => {
      const config = getAccentStyleConfig(-1);
      expect(config).toBe(ACCENT_STYLE_CONFIGS[0]);
    });

    it("should return first config for index too high", () => {
      const config = getAccentStyleConfig(999);
      expect(config).toBe(ACCENT_STYLE_CONFIGS[0]);
    });

    it("should return first config for non-integer index", () => {
      const config = getAccentStyleConfig(2.5);
      expect(config).toBe(ACCENT_STYLE_CONFIGS[0]);
    });

    it("should return first config for NaN index", () => {
      const config = getAccentStyleConfig(NaN);
      expect(config).toBe(ACCENT_STYLE_CONFIGS[0]);
    });
  });

  describe("applyAccentStyle", () => {
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

        expect(result.clockColor.toString()).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(result.dateColor.toString()).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(result.dividerColor.toString()).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should handle invalid style indices gracefully", () => {
      const invalidIndices = [-1, 999, NaN, 2.5];

      invalidIndices.forEach((invalidIndex) => {
        const result = applyAccentStyle(testColor, invalidIndex);
        const expectedResult = applyAccentStyle(testColor, 0); // Should fall back to first config

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

    it("should handle different accent colors consistently", () => {
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

  describe("Color transformation consistency", () => {
    it("should produce consistent results across different colors", () => {
      const colors = [
        new Color("#3584E4"), // Blue
        new Color("#E62D42"), // Red
        new Color("#3A944A"), // Green
      ];

      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        colors.forEach((color) => {
          const result = applyAccentStyle(color, index);

          // All results should be valid Color objects
          expect(result.clockColor).toBeInstanceOf(Color);
          expect(result.dateColor).toBeInstanceOf(Color);
          expect(result.dividerColor).toBeInstanceOf(Color);

          // Results should be deterministic (same input = same output)
          const result2 = applyAccentStyle(color, index);
          expect(result.clockColor.toString()).toBe(
            result2.clockColor.toString(),
          );
          expect(result.dateColor.toString()).toBe(
            result2.dateColor.toString(),
          );
          expect(result.dividerColor.toString()).toBe(
            result2.dividerColor.toString(),
          );
        });
      });
    });
  });
});
