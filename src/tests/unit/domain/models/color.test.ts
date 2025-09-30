/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Color } from "../../../../domain/models/color.js";

describe("Color", () => {
  describe("constructor and toString", () => {
    it("validates and normalizes hex colors", () => {
      expect(new Color("#123").toString()).toBe("#112233");
      expect(new Color("#112233").toString()).toBe("#112233");
    });

    it("throws error for invalid colors", () => {
      expect(() => new Color("invalid")).toThrow(
        "Invalid color format: invalid",
      );
      expect(() => new Color("")).toThrow("Invalid color format: ");
    });

    it("handles RGB color format", () => {
      const color = new Color("rgb(255, 0, 0)");
      expect(color.toString()).toBe("#FF0000");

      const color2 = new Color("rgb(53, 132, 228)");
      expect(color2.toString()).toBe("#3584E4");
    });

    it("throws error for CSS variables (not concrete colors)", () => {
      expect(() => new Color("var(--accent-color)")).toThrow(
        "Invalid color format: var(--accent-color)",
      );
      expect(() => new Color("@theme_fg_color")).toThrow(
        "Invalid color format: @theme_fg_color",
      );
    });
  });

  describe("lighten method", () => {
    it("should lighten hex colors with default amount (0.3)", () => {
      const red = new Color("#FF0000");
      const lightRed = red.lighten();
      expect(lightRed.toString()).toBe("#FF4D4D"); // 30% blend with white
    });

    it("should lighten hex colors with custom amount", () => {
      const black = new Color("#000000");
      const gray25 = black.lighten(0.25);
      expect(gray25.toString()).toBe("#404040"); // 25% blend with white

      const gray75 = black.lighten(0.75);
      expect(gray75.toString()).toBe("#BFBFBF"); // 75% blend with white
    });

    it("should handle full white lightening", () => {
      const blue = new Color("#0000FF");
      const white = blue.lighten(1.0);
      expect(white.toString()).toBe("#FFFFFF");
    });

    it("should handle no lightening (amount = 0)", () => {
      const green = new Color("#00FF00");
      const unchanged = green.lighten(0);
      expect(unchanged.toString()).toBe("#00FF00");
    });
  });

  describe("darken method", () => {
    it("should darken hex colors with default amount (0.2)", () => {
      const white = new Color("#FFFFFF");
      const darkened = white.darken();
      expect(darkened.toString()).toBe("#CCCCCC"); // 80% of original
    });

    it("should darken hex colors with custom amount", () => {
      const red = new Color("#FF0000");
      const darkRed = red.darken(0.5);
      expect(darkRed.toString()).toBe("#800000"); // 50% of original
    });

    it("should handle full black darkening", () => {
      const yellow = new Color("#FFFF00");
      const black = yellow.darken(1.0);
      expect(black.toString()).toBe("#000000");
    });

    it("should handle no darkening (amount = 0)", () => {
      const purple = new Color("#FF00FF");
      const unchanged = purple.darken(0);
      expect(unchanged.toString()).toBe("#FF00FF");
    });
  });

  describe("edge cases", () => {
    it("should handle short hex colors in lighten/darken", () => {
      const shortHex = new Color("#F0A");
      // #F0A expands to #FF00AA
      expect(shortHex.toString()).toBe("#FF00AA");

      const lightened = shortHex.lighten(0.5);
      expect(lightened.toString()).toBe("#FF80D5"); // #FF00AA lightened by 50%

      const darkened = shortHex.darken(0.5);
      expect(darkened.toString()).toBe("#800055"); // #FF00AA darkened by 50%
    });

    it("should round color values properly", () => {
      const color = new Color("#010101");
      const lightened = color.lighten(0.33); // Should produce fractional values that get rounded
      // 1 + (255 - 1) * 0.33 = 1 + 83.82 = 84.82 -> 85 -> #555555
      expect(lightened.toString()).toBe("#555555");
    });
  });
});
