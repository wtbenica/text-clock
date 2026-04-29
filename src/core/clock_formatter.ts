/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { validateDate } from "../utils/error_utils.js";
import { LocalizedStrings } from "../models/localized_strings.js";

/**
 * Time format styles for clock text display.
 */
export enum TimeFormat {
  /** Standard format: "five past two", "quarter to three" */
  FORMAT_ONE = "format-one",

  /** Alternative phrasing for the same times */
  FORMAT_TWO = "format-two",
}

/**
 * Time rounding precision for "fuzzy" time display.
 */
export enum Fuzziness {
  /** Show time to the nearest minute */
  ONE_MINUTE = 1,

  /** Round to nearest 5-minute interval */
  FIVE_MINUTES = 5,

  /** Round to nearest 10-minute interval */
  TEN_MINUTES = 10,

  /** Round to nearest 15 minutes */
  FIFTEEN_MINUTES = 15,
}

/** Separated clock components for independent styling. */
export interface ClockPresentation {
  /** The time portion (e.g., "five past two") */
  time: string;

  /** Divider between time and date (e.g., " | ") */
  divider: string;

  /** The date portion (e.g., "Monday the first") */
  date: string;
}

/**
 * Converts Date objects into human-readable text.
 *
 * Formats time as natural language ("five past two" instead of "2:05").
 * Supports multiple formats, fuzzy rounding, optional date/weekday display,
 * and localized text.
 */
export class ClockFormatter {
  /** Localized strings for time and date */
  wordPack: LocalizedStrings;

  /** Separator between time and date */
  divider: string;

  /**
   * @param wordPack - Localized text strings
   * @param divider - Separator between time and date (default: " | ")
   */
  constructor(wordPack: LocalizedStrings, divider: string = " | ") {
    this.wordPack = wordPack;
    this.divider = divider;
  }

  /**
   * Get complete clock text as a single string.
   *
   * Combines time, divider, and date into one formatted string.
   *
   * @returns Formatted clock text, e.g., "five past two | Monday the first"
   */
  getClockText(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): string {
    const {
      time,
      divider,
      date: dateStr,
    } = this.getClockParts(date, showDate, showWeekday, timeFormat, fuzziness);
    return time + divider + dateStr;
  }

  /**
   * Get clock components as separate strings for independent styling.
   *
   * Returns time, divider, and date as separate properties.
   */
  getClockParts(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): ClockPresentation {
    validateDate(date, "ClockFormatter.getClockText");
    if (fuzziness <= 0) {
      throw new Error("Fuzziness must be a positive number");
    }

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket = Math.round(minutes / fuzziness) * fuzziness;
    const shouldRoundUp = ClockFormatter.#shouldRoundUp(
      minuteBucket,
      timeFormat,
    );
    const roundedHour = (shouldRoundUp ? hours + 1 : hours) % 24;
    const hourName = ClockFormatter.#computeHourName(
      this.wordPack,
      roundedHour,
      minuteBucket,
      timeFormat,
    );
    const time = this.#getTimeString(hourName, minuteBucket, timeFormat);
    // Support showing weekday alone (when showDate is false but showWeekday is true).
    const wantsWeekdayOnly = !showDate && showWeekday;
    const divider = showDate || wantsWeekdayOnly ? this.divider : "";

    let dateStr = "";
    if (showDate) {
      dateStr = this.#getDisplayedDate(date, minuteBucket, showWeekday);
    } else if (wantsWeekdayOnly) {
      const adjustedDate = this.#adjustDateForRounding(date, minuteBucket);
      // Use standalone weekday names (Sunday..Saturday) provided by translators.
      dateStr = this.wordPack.dayNames[adjustedDate.getDay()];
    }

    return { time, divider, date: dateStr };
  }

  static #computeHourName(
    wordPack: LocalizedStrings,
    hour: number,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    const isTopOfTheHour = ClockFormatter.#isTopOfTheHour(minuteBucket);
    if (hour === 0) {
      return isTopOfTheHour
        ? wordPack.midnight
        : ClockFormatter.#getSpecialHourName(wordPack, timeFormat, "midnight");
    }
    if (hour === 12) {
      return isTopOfTheHour
        ? wordPack.noon
        : ClockFormatter.#getSpecialHourName(wordPack, timeFormat, "noon");
    }
    return wordPack.names[hour];
  }

  static #getSpecialHourName(
    wordPack: LocalizedStrings,
    timeFormat: TimeFormat,
    type: "midnight" | "noon",
  ): string {
    const formatMap = {
      [TimeFormat.FORMAT_ONE]: {
        midnight: wordPack.midnightFormatOne,
        noon: wordPack.noonFormatOne,
      },
      [TimeFormat.FORMAT_TWO]: {
        midnight: wordPack.midnightFormatTwo,
        noon: wordPack.noonFormatTwo,
      },
    };

    return formatMap[timeFormat][type];
  }

  #getTimeString(
    hourName: string,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    if (
      ClockFormatter.#isTopOfTheHour(minuteBucket) &&
      ClockFormatter.#isExactHourName(this.wordPack, hourName)
    ) {
      return hourName;
    }

    const times: string[] = this.wordPack.getTimes(timeFormat);
    return times[minuteBucket].format(hourName);
  }

  static #isExactHourName(
    wordPack: LocalizedStrings,
    hourName: string,
  ): boolean {
    return (
      hourName === wordPack.midnight ||
      hourName === wordPack.noon ||
      hourName === wordPack.names[0] ||
      hourName === wordPack.names[12]
    );
  }

  static #shouldRoundUp(minuteBucket: number, timeFormat: TimeFormat): boolean {
    return (
      (timeFormat === TimeFormat.FORMAT_ONE && minuteBucket > 30) ||
      minuteBucket === 60
    );
  }

  static #isTopOfTheHour(minuteBucket: number): boolean {
    return minuteBucket === 0 || minuteBucket === 60;
  }

  #getDisplayedDate(
    date: Date,
    minuteBucket: number,
    showWeekday: boolean,
  ): string {
    const adjustedDate = this.#adjustDateForRounding(date, minuteBucket);

    const weekdayString = showWeekday
      ? this.wordPack.days[adjustedDate.getDay()]
      : this.wordPack.dayOnly;

    const dateString = ClockFormatter.#getDateString(
      this.wordPack,
      adjustedDate.getDate(),
    );

    return weekdayString.format(dateString);
  }

  #adjustDateForRounding(date: Date, minuteBucket: number): Date {
    const isNextDay = date.getHours() === 23 && minuteBucket === 60;
    const adjustedDate = new Date(date);
    if (isNextDay) {
      adjustedDate.setDate(date.getDate() + 1);
    }
    return adjustedDate;
  }

  static #getDateString(wordPack: LocalizedStrings, n: number): string {
    return wordPack.daysOfMonth[n - 1];
  }
}
