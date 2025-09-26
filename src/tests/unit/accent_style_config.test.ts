/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Tests for accent style configuration system.
 */

import { Color } from "../../models/color.js";
import {
  AccentStyleConfig,
  applyAccentStyle,
  ACCENT_STYLE_CONFIGS,
  getAccentStyleConfig,
} from "../../services/accent_style_config.js";

describe("AccentStyleConfig", () => {
  const testColor = new Color("#3584E4"); // GNOME Blue

  describe("ACCENT_STYLE_CONFIGS", () => {
    it("should have 7 predefined configurations", () => {
      expect(ACCENT_STYLE_CONFIGS).toHaveLength(7);
    });

    it("should have valid configurations for all styles", () => {
      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
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

    it("should match expected style names", () => {
      const expectedNames = [
        "Standard",
        "Solid",
        "Duotone",
        "Racing Stripe",
        "Racing Stripe Duotone",
        "Light Variant",
        "Dark Variant",
      ];

      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        expect(config.name).toBe(expectedNames[index]);
      });
    });
  });

  describe("getAccentStyleConfig", () => {
    it("should return correct config for valid indices", () => {
      const config = getAccentStyleConfig(0);
      expect(config.name).toBe("Standard");
      expect(config.description).toBe("Time lighter, date normal");
    });

    it("should return first config for invalid negative index", () => {
      const config = getAccentStyleConfig(-1);
      expect(config.name).toBe("Standard");
    });

    it("should return first config for index too high", () => {
      const config = getAccentStyleConfig(999);
      expect(config.name).toBe("Standard");
    });

    it("should return first config for non-integer index", () => {
      const config = getAccentStyleConfig(2.5);
      expect(config.name).toBe("Standard");
    });

    it("should return first config for NaN index", () => {
      const config = getAccentStyleConfig(NaN);
      expect(config.name).toBe("Standard");
    });
  });

  describe("applyAccentStyle", () => {
    it("should apply Standard style (index 0) correctly", () => {
      const result = applyAccentStyle(testColor, 0);
      expect(result.clockColor.toString()).not.toBe(testColor.toString());
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).not.toBe(testColor.toString());
    });

    it("should apply Solid style (index 1) correctly", () => {
      const result = applyAccentStyle(testColor, 1);
      expect(result.clockColor.toString()).toBe(testColor.toString());
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).toBe(testColor.toString());
    });

    it("should apply Racing Stripe style (index 3) correctly", () => {
      const result = applyAccentStyle(testColor, 3);
      expect(result.clockColor.toString()).toBe(testColor.toString());
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).toBe("#FFFFFF");
    });

    it("should apply Light Variant style (index 5) correctly", () => {
      const result = applyAccentStyle(testColor, 5);
      // All should be lighter versions
      expect(result.clockColor.toString()).not.toBe(testColor.toString());
      expect(result.dateColor.toString()).not.toBe(testColor.toString());
      expect(result.dividerColor.toString()).not.toBe(testColor.toString());
      // Should not be white (that would be Racing Stripe)
      expect(result.dividerColor.toString()).not.toBe("#FFFFFF");
    });

    it("should apply Dark Variant style (index 6) correctly", () => {
      const result = applyAccentStyle(testColor, 6);
      // All should be darker versions
      expect(result.clockColor.toString()).not.toBe(testColor.toString());
      expect(result.dateColor.toString()).not.toBe(testColor.toString());
      expect(result.dividerColor.toString()).not.toBe(testColor.toString());
    });

    it("should fallback to Standard for invalid style indices", () => {
      const standardResult = applyAccentStyle(testColor, 0);
      const invalidResult = applyAccentStyle(testColor, -1);
      const tooHighResult = applyAccentStyle(testColor, 999);

      expect(invalidResult.clockColor.toString()).toBe(
        standardResult.clockColor.toString(),
      );
      expect(invalidResult.dateColor.toString()).toBe(
        standardResult.dateColor.toString(),
      );
      expect(invalidResult.dividerColor.toString()).toBe(
        standardResult.dividerColor.toString(),
      );

      expect(tooHighResult.clockColor.toString()).toBe(
        standardResult.clockColor.toString(),
      );
      expect(tooHighResult.dateColor.toString()).toBe(
        standardResult.dateColor.toString(),
      );
      expect(tooHighResult.dividerColor.toString()).toBe(
        standardResult.dividerColor.toString(),
      );
    });

    it("should handle different accent colors consistently", () => {
      const blueColor = new Color("#3584E4");
      const redColor = new Color("#E62D42");

      const blueResult = applyAccentStyle(blueColor, 1); // Solid
      const redResult = applyAccentStyle(redColor, 1); // Solid

      // Both should use their respective accent colors for all elements
      expect(blueResult.clockColor.toString()).toBe(blueColor.toString());
      expect(blueResult.dateColor.toString()).toBe(blueColor.toString());
      expect(redResult.clockColor.toString()).toBe(redColor.toString());
      expect(redResult.dateColor.toString()).toBe(redColor.toString());
    });

    it("should return Color objects, not strings", () => {
      const result = applyAccentStyle(testColor, 0);
      expect(result.clockColor).toBeInstanceOf(Color);
      expect(result.dateColor).toBeInstanceOf(Color);
      expect(result.dividerColor).toBeInstanceOf(Color);
    });
  });

  describe("Color transformation consistency", () => {
    it("should produce consistent lightening across different colors", () => {
      const colors = [
        new Color("#3584E4"), // Blue
        new Color("#E62D42"), // Red
        new Color("#3A944A"), // Green
      ];

      colors.forEach((color) => {
        const result = applyAccentStyle(color, 5); // Light Variant
        // Verify all elements are lighter than original
        const clockIsLighter =
          result.clockColor.toString() !== color.toString();
        const dateIsLighter = result.dateColor.toString() !== color.toString();
        const dividerIsLighter =
          result.dividerColor.toString() !== color.toString();

        expect(clockIsLighter).toBe(true);
        expect(dateIsLighter).toBe(true);
        expect(dividerIsLighter).toBe(true);
      });
    });

    it("should produce consistent darkening across different colors", () => {
      const colors = [
        new Color("#3584E4"), // Blue
        new Color("#E62D42"), // Red
        new Color("#3A944A"), // Green
      ];

      colors.forEach((color) => {
        const result = applyAccentStyle(color, 6); // Dark Variant
        // Verify all elements are darker than original
        const clockIsDarker = result.clockColor.toString() !== color.toString();
        const dateIsDarker = result.dateColor.toString() !== color.toString();
        const dividerIsDarker =
          result.dividerColor.toString() !== color.toString();

        expect(clockIsDarker).toBe(true);
        expect(dateIsDarker).toBe(true);
        expect(dividerIsDarker).toBe(true);
      });
    });
  });
});
