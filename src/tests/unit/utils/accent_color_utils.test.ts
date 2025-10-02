// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { accentNameToHex } from "../../../utils/color/accent_color_utils.js";

describe("accentNameToHex", () => {
  describe("basic color matching", () => {
    it("should return correct hex for standard color names", () => {
      expect(accentNameToHex("blue")).toBe("#3584E4");
      expect(accentNameToHex("teal")).toBe("#2190A4");
      expect(accentNameToHex("green")).toBe("#3A944A");
      expect(accentNameToHex("yellow")).toBe("#C88800");
      expect(accentNameToHex("orange")).toBe("#ED5B00");
      expect(accentNameToHex("red")).toBe("#E62D42");
      expect(accentNameToHex("pink")).toBe("#D56199");
      expect(accentNameToHex("purple")).toBe("#9141AC");
      expect(accentNameToHex("slate")).toBe("#6F8396");
    });

    it("should handle case insensitive matching", () => {
      expect(accentNameToHex("BLUE")).toBe("#3584E4");
      expect(accentNameToHex("Blue")).toBe("#3584E4");
      expect(accentNameToHex("bLuE")).toBe("#3584E4");
    });

    it("should trim whitespace", () => {
      expect(accentNameToHex("  blue  ")).toBe("#3584E4");
      expect(accentNameToHex("\t red \n")).toBe("#E62D42");
      expect(accentNameToHex("   green   ")).toBe("#3A944A");
    });
  });

  describe("edge cases", () => {
    it("should return undefined for null", () => {
      expect(accentNameToHex(null)).toBeUndefined();
    });

    it("should return undefined for undefined", () => {
      expect(accentNameToHex(undefined)).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(accentNameToHex("")).toBeUndefined();
      expect(accentNameToHex("   ")).toBeUndefined();
    });

    it("should return undefined for unknown colors", () => {
      expect(accentNameToHex("magenta")).toBeUndefined();
      expect(accentNameToHex("unknown")).toBeUndefined();
      expect(accentNameToHex("notacolor")).toBeUndefined();
    });
  });
});
