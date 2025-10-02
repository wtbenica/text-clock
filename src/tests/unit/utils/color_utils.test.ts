// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { Color } from "../../../models/color.js";

describe("Color class normalization", () => {
  it("handles RGB format", () => {
    expect(new Color("rgb(255, 0, 128)").toString()).toBe("#FF0080");
    expect(new Color("rgb(0, 0, 0)").toString()).toBe("#000000");
    expect(new Color("rgb(300, -10, 20)").toString()).toBe("#FF0014"); // clamps values
  });

  it("handles hex format with #", () => {
    expect(new Color("#abc").toString()).toBe("#AABBCC");
    expect(new Color("#123456").toString()).toBe("#123456");
  });

  it("handles hex format without #", () => {
    expect(new Color("abc").toString()).toBe("#AABBCC");
    expect(new Color("123456").toString()).toBe("#123456");
  });

  it("throws for invalid colors", () => {
    expect(() => new Color("")).toThrow();
    expect(() => new Color("notacolor")).toThrow();
  });
});
