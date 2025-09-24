/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ClockPresenter } from "../../../ui/presenters/clock_presenter.js";
import { Color } from "../../../models/color.js";

// Minimal valid WordPack instance
// Create full-length arrays expected by ClockFormatter (24 hour names, 7 weekdays, 31 day suffixes)
const hourNames = Array.from({ length: 24 }, (_, i) => `h${i}`);
const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const daysOfMonth = Array.from({ length: 31 }, (_, i) => `${i + 1}th`);

const fakePack = new (require("../../../word_pack.js").WordPack)({
  timesFormatOne: Array.from({ length: 61 }, () => "%s"),
  midnightFormatOne: "midnight",
  noonFormatOne: "noon",
  timesFormatTwo: Array.from({ length: 61 }, () => "%s"),
  midnightFormatTwo: "midnight",
  noonFormatTwo: "noon",
  names: hourNames,
  days: weekdayNames,
  dayOnly: "1",
  midnight: "midnight",
  noon: "noon",
  daysOfMonth: daysOfMonth,
});

describe("ClockPresenter", () => {
  it("produces presentation and styles without GJS", () => {
    const presenter = new ClockPresenter({
      translatePack: fakePack,
      dividerText: " - ",
    });

    const now = new Date(2020, 0, 1, 12, 0, 0);
    const presentation = presenter.present(now);

    expect(typeof presentation.time).toBe("string");
    expect(typeof presentation.divider).toBe("string");
    expect(typeof presentation.date).toBe("string");

    const styles = presenter.buildStyles(
      new Color("#112233"),
      new Color("#445566"),
      new Color("#778899"),
    );
    expect(styles.timeStyle).toContain("color:");
    expect(styles.dateStyle).toContain("color:");
    expect(styles.dividerStyle).toContain("color:");
  });
});
