/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Color } from "../../../models/color.js";

describe("Color", () => {
  it("validates and normalizes hex colors", () => {
    expect(new Color("#123").toString()).toBe("#112233");
    expect(new Color("#112233").toString()).toBe("#112233");
  });

  it("validates and normalizes rgb colors", () => {
    expect(new Color("rgb(255, 0, 0)").toString()).toBe("rgb(255, 0, 0)");
  });

  it("throws error for invalid colors", () => {
    expect(() => new Color("invalid")).toThrow("Invalid color format: invalid");
  });
});
