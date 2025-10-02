// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { parseGnomeShellVersionString } from "../../../utils/parse_utils.js";

describe("parseGnomeShellVersionString", () => {
  it("parses plain major.minor string", () => {
    expect(parseGnomeShellVersionString("47.1")).toBe(47);
  });

  it("parses GNOME Shell prefixed string", () => {
    expect(parseGnomeShellVersionString("GNOME Shell 46.3")).toBe(46);
  });

  it("parses integer-only string", () => {
    expect(parseGnomeShellVersionString("45")).toBe(45);
  });

  it("returns NaN for unrelated strings", () => {
    expect(Number.isNaN(parseGnomeShellVersionString("foobar"))).toBe(true);
  });

  it("handles null/undefined gracefully", () => {
    expect(Number.isNaN(parseGnomeShellVersionString(null))).toBe(true);
    expect(Number.isNaN(parseGnomeShellVersionString(undefined))).toBe(true);
  });
});
