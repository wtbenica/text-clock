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
    it("should have 7 style names", () => {
      expect(ACCENT_COLOR_STYLE_NAMES).toHaveLength(7);
    });

    it("should match configuration names", () => {
      const configNames = ACCENT_STYLE_CONFIGS.map((config) => config.name);
      expect(ACCENT_COLOR_STYLE_NAMES).toEqual(configNames);
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
  });

  describe("ACCENT_STYLE_CONFIGS", () => {
    it("should have 7 configurations", () => {
      expect(ACCENT_STYLE_CONFIGS).toHaveLength(7);
    });

    it("should have all required properties", () => {
      ACCENT_STYLE_CONFIGS.forEach((config, index) => {
        expect(config).toHaveProperty("name");
        expect(config).toHaveProperty("description");
        expect(config).toHaveProperty("clockColor");
        expect(config).toHaveProperty("dateColor");
        expect(config).toHaveProperty("dividerColor");
        expect(typeof config.clockColor).toBe("function");
        expect(typeof config.dateColor).toBe("function");
        expect(typeof config.dividerColor).toBe("function");
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

    it("should return default config for invalid indices", () => {
      expect(getAccentStyleConfig(-1)).toBe(ACCENT_STYLE_CONFIGS[0]);
      expect(getAccentStyleConfig(999)).toBe(ACCENT_STYLE_CONFIGS[0]);
    });
  });

  describe("applyAccentStyle", () => {
    const testColor = new Color("#3584E4"); // GNOME Blue

    it("should apply style 0 (Standard) correctly", () => {
      const result = applyAccentStyle(testColor, 0);
      expect(result.clockColor.toString()).toBe(
        testColor.lighten(0.3).toString(),
      );
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).toBe(
        testColor.lighten(0.3).toString(),
      );
    });

    it("should apply style 1 (Solid) correctly", () => {
      const result = applyAccentStyle(testColor, 1);
      expect(result.clockColor.toString()).toBe(testColor.toString());
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).toBe(testColor.toString());
    });

    it("should apply style 3 (Racing Stripe) correctly", () => {
      const result = applyAccentStyle(testColor, 3);
      expect(result.clockColor.toString()).toBe(testColor.toString());
      expect(result.dateColor.toString()).toBe(testColor.toString());
      expect(result.dividerColor.toString()).toBe("#FFFFFF");
    });

    it("should fallback to Standard for invalid indices", () => {
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
  });
});
