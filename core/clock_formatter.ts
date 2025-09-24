/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { WordPack } from "../word_pack.js";
import { validateDate } from "../utils/error_utils.js";

export enum TimeFormat {
  FORMAT_ONE = "format-one",
  FORMAT_TWO = "format-two",
}

export enum Fuzziness {
  ONE_MINUTE = 1,
  FIVE_MINUTES = 5,
  TEN_MINUTES = 10,
  FIFTEEN_MINUTES = 15,
}

export class ClockFormatter {
  wordPack: WordPack;
  divider: string;
  #cachedHourNames: Map<string, string> = new Map();

  constructor(wordPack: WordPack, divider: string = " | ") {
    this.wordPack = wordPack;
    this.divider = divider;
  }

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

  getClockParts(
    date: Date,
    showDate: boolean,
    showWeekday: boolean,
    timeFormat: TimeFormat,
    fuzziness: Fuzziness,
  ): { time: string; divider: string; date: string } {
    validateDate(date, "ClockFormatter.getClockParts");
    if (fuzziness <= 0) {
      throw new Error("Fuzziness must be a positive number");
    }

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const minuteBucket = Math.round(minutes / fuzziness) * fuzziness;
    const shouldRoundUp = this.#shouldRoundUp(minuteBucket, timeFormat);
    const roundedHour = (shouldRoundUp ? hours + 1 : hours) % 24;
    const hourName = this.#getHourName(roundedHour, minuteBucket, timeFormat);
    const time = this.#getTimeString(hourName, minuteBucket, timeFormat);
    const divider = showDate ? this.divider : "";
    const dateStr = showDate
      ? this.#getDisplayedDate(date, minuteBucket, showWeekday)
      : "";

    return { time, divider, date: dateStr };
  }

  #getHourName(
    hour: number,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    const cacheKey = `${hour}-${minuteBucket}-${timeFormat}`;
    if (this.#cachedHourNames.has(cacheKey)) {
      return this.#cachedHourNames.get(cacheKey)!;
    }
    const hourName = this.#getHourNameUncached(hour, minuteBucket, timeFormat);
    this.#cachedHourNames.set(cacheKey, hourName);
    return hourName;
  }

  #getHourNameUncached(
    hour: number,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    const isTopOfTheHour = this.#isTopOfTheHour(minuteBucket);
    if (hour === 0) {
      return isTopOfTheHour
        ? this.wordPack.midnight
        : this.#getSpecialHourName(timeFormat, "midnight");
    }
    if (hour === 12) {
      return isTopOfTheHour
        ? this.wordPack.noon
        : this.#getSpecialHourName(timeFormat, "noon");
    }
    return this.wordPack.names[hour];
  }

  #getSpecialHourName(
    timeFormat: TimeFormat,
    type: "midnight" | "noon",
  ): string {
    const formatMap = {
      [TimeFormat.FORMAT_ONE]: {
        midnight: this.wordPack.midnightFormatOne,
        noon: this.wordPack.noonFormatOne,
      },
      [TimeFormat.FORMAT_TWO]: {
        midnight: this.wordPack.midnightFormatTwo,
        noon: this.wordPack.noonFormatTwo,
      },
    };

    return formatMap[timeFormat][type];
  }

  #getTimeString(
    hourName: string,
    minuteBucket: number,
    timeFormat: TimeFormat,
  ): string {
    if (this.#isTopOfTheHour(minuteBucket) && this.#isExactHourName(hourName)) {
      return hourName;
    }

    const times: string[] = this.wordPack.getTimes(timeFormat);
    return times[minuteBucket].format(hourName);
  }

  #isExactHourName(hourName: string): boolean {
    return (
      hourName === this.wordPack.midnight ||
      hourName === this.wordPack.noon ||
      hourName === this.wordPack.names[0] ||
      hourName === this.wordPack.names[12]
    );
  }

  #shouldRoundUp(minuteBucket: number, timeFormat: TimeFormat): boolean {
    return (
      (timeFormat === TimeFormat.FORMAT_ONE && minuteBucket > 30) ||
      minuteBucket === 60
    );
  }

  #isTopOfTheHour(minuteBucket: number): boolean {
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

    const dateString = this.#getDateString(adjustedDate.getDate());

    return this.#formatString(weekdayString, dateString);
  }

  #adjustDateForRounding(date: Date, minuteBucket: number): Date {
    const isNextDay = date.getHours() === 23 && minuteBucket === 60;
    const adjustedDate = new Date(date);
    if (isNextDay) {
      adjustedDate.setDate(date.getDate() + 1);
    }
    return adjustedDate;
  }

  #formatString(template: string, arg: string): string {
    return template.format(arg);
  }

  #getDateString(n: number): string {
    return this.wordPack.daysOfMonth[n - 1];
  }
}
