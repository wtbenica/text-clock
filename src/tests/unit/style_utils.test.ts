// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { buildStyles } from "../../utils/style/style_utils.js";
import { Color } from "../../models/color.js";

describe("buildStyles", () => {
  it("should create style objects with correct color values", () => {
    const clockColor = new Color("#FF0000");
    const dateColor = new Color("#00FF00");
    const dividerColor = new Color("#0000FF");

    const styles = buildStyles(clockColor, dateColor, dividerColor);

    expect(styles).toEqual({
      timeStyle: "color: #FF0000;",
      dateStyle: "color: #00FF00;",
      dividerStyle: "color: #0000FF; font-weight: bold;",
    });
  });

  it("should handle different color formats", () => {
    const clockColor = new Color("rgb(255, 0, 0)");
    const dateColor = new Color("#00FF00");
    const dividerColor = new Color("rgba(0, 0, 255, 0.5)");

    const styles = buildStyles(clockColor, dateColor, dividerColor);

    expect(styles.timeStyle).toBe("color: rgb(255, 0, 0);");
    expect(styles.dateStyle).toBe("color: #00FF00;");
    expect(styles.dividerStyle).toBe(
      "color: rgba(0, 0, 255, 0.5); font-weight: bold;",
    );
  });

  it("should always include font-weight bold for divider", () => {
    const color = new Color("#FFFFFF");
    const styles = buildStyles(color, color, color);

    expect(styles.dividerStyle).toContain("font-weight: bold");
    expect(styles.timeStyle).not.toContain("font-weight");
    expect(styles.dateStyle).not.toContain("font-weight");
  });

  it("should handle white color", () => {
    const white = new Color("#FFFFFF");
    const styles = buildStyles(white, white, white);

    expect(styles.timeStyle).toBe("color: #FFFFFF;");
    expect(styles.dateStyle).toBe("color: #FFFFFF;");
    expect(styles.dividerStyle).toBe("color: #FFFFFF; font-weight: bold;");
  });

  it("should handle black color", () => {
    const black = new Color("#000000");
    const styles = buildStyles(black, black, black);

    expect(styles.timeStyle).toBe("color: #000000;");
    expect(styles.dateStyle).toBe("color: #000000;");
    expect(styles.dividerStyle).toBe("color: #000000; font-weight: bold;");
  });
});
