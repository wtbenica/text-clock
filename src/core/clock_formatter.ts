/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { validateDate } from "../utils/error_utils.js";
import { WordPack } from "../word_pack.js";

/**
 * Time format styles available for clock text display.
 *
 * Different formats provide alternative phrasing for the same time,
 * allowing users to choose their preferred language style.
 */
export enum TimeFormat {
  /** Standard format: "five past two", "quarter to three" */
  FORMAT_ONE = "format-one",

  /** Alternative format: different phrasing for the same times */
  FORMAT_TWO = "format-two",
}

/**
 * Time rounding precision levels for "fuzzy" time display.
 *
 * Fuzziness controls how precisely the clock displays time by rounding
 * to the nearest interval. Higher fuzziness creates more natural-sounding
 * but less precise time expressions.
 */
export enum Fuzziness {
  /** Show time to the nearest minute (most precise) */
  ONE_MINUTE = 1,

  /** Round to nearest 5-minute interval */
  FIVE_MINUTES = 5,

  /** Round to nearest 10-minute interval */
  TEN_MINUTES = 10,

  /** Round to nearest 15-minute interval (least precise) */
  FIFTEEN_MINUTES = 15,
}

/**
 * Structured representation of clock text components.
 *
 * Separates the clock display into distinct parts for flexible rendering
 * and styling. Each component can be styled independently in the UI.
 */
export interface ClockPresentation {
  /** The time portion (e.g., "five past two") */
  time: string;

  /** The divider between time and date (e.g., " | ", empty if no date) */
  divider: string;

  /** The date portion (e.g., "Monday the first", empty if not shown) */
  date: string;
}

/**
 * Core formatter for converting Date objects into human-readable text.
 *
 * ClockFormatter is the heart of the text-clock extension, responsible for
 * transforming precise time data into natural language expressions. It handles
 * multiple time formats, fuzzy time rounding, date formatting, and localization.
 *
 * The formatter supports:
 * - Multiple time format styles (FORMAT_ONE, FORMAT_TWO)
 * - Configurable time rounding (fuzziness)
 * - Optional date and weekday display
 * - Localized text via WordPack
 * - Structured output for flexible UI styling
 *
 * @example
 * ```typescript
 * const formatter = new ClockFormatter(wordPack, " • ");
 * const now = new Date();
 *
 * // Get complete clock text
 * const text = formatter.getClockText(
 *   now, true, true, TimeFormat.FORMAT_ONE, Fuzziness.FIVE_MINUTES
 * );
 * console.log(text); // "five past two • Monday the first"
 *
 * // Get structured components
 * const parts = formatter.getPresentation(
 *   now, true, true, TimeFormat.FORMAT_ONE, Fuzziness.FIVE_MINUTES
 * );
 * console.log(parts.time);    // "five past two"
 * console.log(parts.divider); // " • "
 * console.log(parts.date);    // "Monday the first"
 * ```
 */
export class ClockFormatter {
  /** Localized text strings for time and date formatting */
  wordPack: WordPack;

  /** Text separator between time and date components */
  divider: string;

  /**
   * Creates a new clock formatter with localized text and divider.
   *
   * @param wordPack - Container of localized text strings
   * @param divider - Text separator between time and date (defaults to " | ")
   */
  constructor(wordPack: WordPack, divider: string = " | ") {
    this.wordPack = wordPack;
    this.divider = divider;
  }

  /**
   * Generates complete clock text as a single formatted string.
   *
   * This is the primary method for getting clock display text. It combines
   * time, divider, and date components into a single string suitable for
   * direct display in UI elements.
   *
   * @param date - The date/time to format
   * @param showDate - Whether to include date in the output
   * @param showWeekday - Whether to include weekday (ignored if showDate is false)
   * @param timeFormat - The time format style to use
   * @param fuzziness - Time rounding precision level
   * @returns Complete formatted clock text (e.g., "five past two | Monday the first")
   *
   * @throws {Error} When date is invalid or fuzziness is not positive
   *
   * @example
   * ```typescript
   * const text = formatter.getClockText(
   *   new Date(2024, 0, 1, 14, 5), // Jan 1, 2024, 2:05 PM
   *   true,                        // show date
   *   true,                        // show weekday
   *   TimeFormat.FORMAT_ONE,       // "five past two" style
   *   Fuzziness.FIVE_MINUTES      // round to 5-min intervals
   * );
   * // Result: "five past two | Monday the first"
   * ```
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
   * Generates clock components as separate strings for flexible styling.
   *
   * This method provides the same functionality as getClockText() but returns
   * the components separately, allowing UI code to style each part independently.
   *
   * @param date - The date/time to format
   * @param showDate - Whether to include date component
   * @param showWeekday - Whether to include weekday in date (ignored if showDate is false)
   * @param timeFormat - The time format style to use
   * @param fuzziness - Time rounding precision level
   * @returns Object with separate time, divider, and date strings
   *
   * @throws {Error} When date is invalid or fuzziness is not positive
   *
   * @example
   * ```typescript
   * const parts = formatter.getClockParts(
   *   new Date(2024, 0, 1, 14, 5),
   *   true, true, TimeFormat.FORMAT_ONE, Fuzziness.FIVE_MINUTES
   * );
   * console.log(parts.time);    // "five past two"
   * console.log(parts.divider); // " | "
   * console.log(parts.date);    // "Monday the first"
   * ```
   */
  getClockParts(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): { time: string; divider: string; date: string } {
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
    const hourName = this.#getHourName(roundedHour, minuteBucket, timeFormat);
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

  /**
   * Generates structured clock presentation for advanced UI scenarios.
   *
   * This method returns a ClockPresentation object, which is essentially
   * the same as getClockParts() but with a more formal interface. Use this
   * when you need type safety or are working with UI components that expect
   * the ClockPresentation interface.
   *
   * @param date - The date/time to format
   * @param showDate - Whether to include date component
   * @param showWeekday - Whether to include weekday in date
   * @param timeFormat - The time format style to use
   * @param fuzziness - Time rounding precision level
   * @returns ClockPresentation object with typed component properties
   *
   * @throws {Error} When date is invalid or fuzziness is not positive
   *
   * @example
   * ```typescript
   * const presentation: ClockPresentation = formatter.getPresentation(
   *   new Date(), true, true, TimeFormat.FORMAT_ONE, Fuzziness.TEN_MINUTES
   * );
   *
   * // Use with UI components expecting ClockPresentation
   * clockWidget.setPresentation(presentation);
   * ```
   */
  getPresentation(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): ClockPresentation {
    const parts = this.getClockParts(
      date,
      showDate,
      showWeekday,
      timeFormat,
      fuzziness,
    );
    return {
      time: parts.time,
      divider: parts.divider,
      date: parts.date,
    };
  }

  #getHourName(
    hour: number,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    return ClockFormatter.#computeHourName(
      this.wordPack,
      hour,
      minuteBucket,
      timeFormat,
    );
  }

  static #computeHourName(
    wordPack: WordPack,
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
    wordPack: WordPack,
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

  static #isExactHourName(wordPack: WordPack, hourName: string): boolean {
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

  static #getDateString(wordPack: WordPack, n: number): string {
    return wordPack.daysOfMonth[n - 1];
  }
}
