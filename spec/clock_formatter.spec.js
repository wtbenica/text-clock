/*
 * Copyright (c) 2024 Wesley T Benica
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { ClockFormatter } from "../dist/clock_formatter.js";
import { WordPack } from "../dist/word_pack.js";

const wordPack = new WordPack({
  times: [
    "%s o'clock",
    "one past %s",
    "two past %s",
    "three past %s",
    "four past %s",
    "five past %s",
    "six past %s",
    "seven past %s",
    "eight past %s",
    "nine past %s",
    "ten past %s",
    "eleven past %s",
    "twelve past %s",
    "thirteen past %s",
    "fourteen past %s",
    "quarter past %s",
    "sixteen past %s",
    "seventeen past %s",
    "eighteen past %s",
    "nineteen past %s",
    "twenty past %s",
    "twenty one past %s",
    "twenty two past %s",
    "twenty three past %s",
    "twenty four past %s",
    "twenty five past %s",
    "twenty six past %s",
    "twenty seven past %s",
    "twenty eight past %s",
    "twenty nine past %s",
    "half past %s",
    "twenty nine to %s",
    "twenty eight to %s",
    "twenty seven to %s",
    "twenty six to %s",
    "twenty five to %s",
    "twenty four to %s",
    "twenty three to %s",
    "twenty two to %s",
    "twenty one to %s",
    "twenty to %s",
    "nineteen to %s",
    "eighteen to %s",
    "seventeen to %s",
    "sixteen to %s",
    "quarter to %s",
    "fourteen to %s",
    "thirteen to %s",
    "twelve to %s",
    "eleven to %s",
    "ten to %s",
    "nine to %s",
    "eight to %s",
    "seven to %s",
    "six to %s",
    "five to %s",
    "four to %s",
    "three to %s",
    "two to %s",
    "one to %s",
  ],
  names: [
    "midnight",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "noon",
  ],
  days: [
    "sunday the %s",
    "monday the %s",
    "tuesday the %s",
    "wednesday the %s",
    "thursday the %s",
    "friday the %s",
    "saturday the %s",
  ],
  midnight: "midnight",
  noon: "noon",
  daysOfMonth: [
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
    "eleventh",
    "twelfth",
    "thirteenth",
    "fourteenth",
    "fifteenth",
    "sixteenth",
    "seventeenth",
    "eighteenth",
    "nineteenth",
    "twentieth",
    "twenty first",
    "twenty second",
    "twenty third",
    "twenty fourth",
    "twenty fifth",
    "twenty sixth",
    "twenty seventh",
    "twenty eighth",
    "twenty ninth",
    "thirtieth",
    "thirty first",
  ],
});

/**
 * TEST CASES:
 * 00:01 | 7/7/2024 | no date -> "midnight"
 * 23:58 | 7/6/2024 | date -> "midnight | sunday the seventh"
 * 11:59 | 7/8/2024 | no date -> "noon"
 * 12:00 | 7/9/2024 | date -> "noon | monday the ninth"
 * 01:04 | 7/10/2024 | no date -> "one o'clock"
 * 02:08 | 7/11/2024 | date -> "ten past two | wednesday the eleventh"
 * 03:16 | 7/12/2024 | no date -> "quarter past three"
 * 04:20 | 7/13/2024 | date -> "twenty past four | friday the thirteenth"
 * 05:24 | 7/14/2024 | no date -> "twenty five past five"
 * 06:30 | 7/15/2024 | date -> "half past six | saturday the fifteenth"
 * 07:35 | 7/16/2024 | no date -> "twenty five to eight"
 * 08:40 | 7/17/2024 | date -> "twenty to nine | sunday the seventeenth"
 * 09:45 | 7/18/2024 | no date -> "quarter to ten"
 * 10:50 | 7/19/2024 | date -> "ten to eleven | monday the nineteenth"
 * 11:55 | 7/20/2024 | no date -> "five to noon"
 * 12:05 | 7/21/2024 | date -> "five past noon | tuesday the twenty first"
 * 13:10 | 7/22/2024 | no date -> "ten past one"
 * 14:15 | 7/23/2024 | date -> "quarter past two | wednesday the twenty third"
 * 15:20 | 7/24/2024 | no date -> "twenty past three"
 * 16:25 | 7/25/2024 | date -> "twenty five past four | friday the twenty fifth"
 * 17:30 | 7/26/2024 | no date -> "half past five"
 * 18:35 | 7/27/2024 | date -> "twenty five to seven | saturday the twenty seventh"
 * 19:40 | 7/28/2024 | no date -> "twenty to eight"
 * 20:45 | 7/29/2024 | date -> "quarter to nine | sunday the twenty ninth"
 * 21:50 | 7/30/2024 | no date -> "ten to ten"
 * 22:55 | 7/31/2024 | date -> "five to eleven | monday the thirty first"
 * 23:59 | 8/1/2024 | no date -> "midnight"
 */

describe("ClockFormatter", () => {
  describe("getClockText", () => {
    const clockFormatter = new ClockFormatter(wordPack, 5);

    it('should return "midnight" when the time is 00:01 and there is no date', () => {
      const date = new Date(2024, 6, 6, 0, 1);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("midnight");
    }); // undefined

    it('should return "midnight | sunday the seventh" when the time is 23:58 and there is a date', () => {
      const date = new Date(2024, 6, 6, 23, 58);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("midnight | sunday the seventh");
    }); // eleven | saturday the sixth

    it('should return "noon" when the time is 11:59 and there is no date', () => {
      const date = new Date(2024, 6, 8, 11, 59);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("noon");
    }); // eleven

    it('should return "noon | tuesday the ninth" when the time is 12:00 and there is a date', () => {
      const date = new Date(2024, 6, 9, 12, 0);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("noon | tuesday the ninth");
    }); // undefined | tuesday the ninth

    it('should return "five past one" when the time is 01:04 and there is no date', () => {
      const date = new Date(2024, 6, 10, 1, 4);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("five past one");
    });

    it('should return "ten past two | thursday the eleventh" when the time is 02:08 and there is a date', () => {
      const date = new Date(2024, 6, 11, 2, 8);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("ten past two | thursday the eleventh");
    });

    it('should return "quarter past three" when the time is 03:16 and there is no date', () => {
      const date = new Date(2024, 6, 12, 3, 16);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("quarter past three");
    });

    it('should return "twenty past four | saturday the thirteenth" when the time is 04:20 and there is a date', () => {
      const date = new Date(2024, 6, 13, 4, 20);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("twenty past four | saturday the thirteenth");
    });

    it('should return "twenty five past five" when the time is 05:24 and there is no date', () => {
      const date = new Date(2024, 6, 14, 5, 24);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("twenty five past five");
    });

    it('should return "half past six | monday the fifteenth" when the time is 06:30 and there is a date', () => {
      const date = new Date(2024, 6, 15, 6, 30);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("half past six | monday the fifteenth");
    });

    it('should return "twenty five to eight" when the time is 07:35 and there is no date', () => {
      const date = new Date(2024, 6, 16, 7, 35);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("twenty five to eight");
    });

    it('should return "twenty to nine | wednesday the seventeenth" when the time is 08:40 and there is a date', () => {
      const date = new Date(2024, 6, 17, 8, 40);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("twenty to nine | wednesday the seventeenth");
    });

    it('should return "quarter to ten" when the time is 09:45 and there is no date', () => {
      const date = new Date(2024, 6, 18, 9, 45);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("quarter to ten");
    });

    it('should return "ten to eleven | friday the nineteenth" when the time is 10:50 and there is a date', () => {
      const date = new Date(2024, 6, 19, 10, 50);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("ten to eleven | friday the nineteenth");
    });

    it('should return "five to noon" when the time is 11:55 and there is no date', () => {
      const date = new Date(2024, 6, 20, 11, 55);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("five to noon");
    }); // five to midnight

    it('should return "five past noon | sunday the twenty first" when the time is 12:05 and there is a date', () => {
      const date = new Date(2024, 6, 21, 12, 5);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("five past noon | sunday the twenty first");
    }); // five past midnight | sunday the twenty first

    it('should return "ten past one" when the time is 13:10 and there is no date', () => {
      const date = new Date(2024, 6, 22, 13, 10);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("ten past one");
    });

    it('should return "quarter past two | tuesday the twenty third" when the time is 14:15 and there is a date', () => {
      const date = new Date(2024, 6, 23, 14, 15);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("quarter past two | tuesday the twenty third");
    });

    it('should return "twenty past three" when the time is 15:20 and there is no date', () => {
      const date = new Date(2024, 6, 24, 15, 20);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("twenty past three");
    });

    it('should return "twenty five past four | thursday the twenty fifth" when the time is 16:25 and there is a date', () => {
      const date = new Date(2024, 6, 25, 16, 25);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("twenty five past four | thursday the twenty fifth");
    });

    it('should return "half past five" when the time is 17:30 and there is no date', () => {
      const date = new Date(2024, 6, 26, 17, 30);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("half past five");
    });

    it('should return "twenty five to seven | saturday the twenty seventh" when the time is 18:35 and there is a date', () => {
      const date = new Date(2024, 6, 27, 18, 35);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("twenty five to seven | saturday the twenty seventh");
    });

    it('should return "twenty to eight" when the time is 19:40 and there is no date', () => {
      const date = new Date(2024, 6, 28, 19, 40);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("twenty to eight");
    });

    it('should return "quarter to nine | monday the twenty ninth" when the time is 20:45 and there is a date', () => {
      const date = new Date(2024, 6, 29, 20, 45);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("quarter to nine | monday the twenty ninth");
    });

    it('should return "ten to ten" when the time is 21:50 and there is no date', () => {
      const date = new Date(2024, 6, 30, 21, 50);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("ten to ten");
    });

    it('should return "five to eleven | wednesday the thirty first" when the time is 22:55 and there is a date', () => {
      const date = new Date(2024, 6, 31, 22, 55);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("five to eleven | wednesday the thirty first");
    });

    it('should return "midnight" when the time is 23:59 and there is no date', () => {
      const date = new Date(2024, 6, 1, 23, 59);
      const result = clockFormatter.getClockText(date, false);
      expect(result).toBe("midnight");
    }); // eleven

    it('should return "seven o\'clock | thursday the first" when the time is 07:00 and there is a date', () => {
      const date = new Date(2024, 7, 1, 7, 0);
      const result = clockFormatter.getClockText(date, true);
      expect(result).toBe("seven o'clock | thursday the first");
    });
  });
});

const times = [
  "%s o'clock",
  "one past %s",
  "two past %s",
  "three past %s",
  "four past %s",
  "five past %s",
  "six past %s",
  "seven past %s",
  "eight past %s",
  "nine past %s",
  "ten past %s",
  "eleven past %s",
  "twelve past %s",
  "thirteen past %s",
  "fourteen past %s",
  "quarter past %s",
  "sixteen past %s",
  "seventeen past %s",
  "eighteen past %s",
  "nineteen past %s",
  "twenty past %s",
  "twenty one past %s",
  "twenty two past %s",
  "twenty three past %s",
  "twenty four past %s",
  "twenty five past %s",
  "twenty six past %s",
  "twenty seven past %s",
  "twenty eight past %s",
  "twenty nine past %s",
  "half past %s",
  "thirty one past %s",
  "thirty two past %s",
  "thirty three past %s",
  "thirty four past %s",
  "thirty five past %s",
  "thirty six past %s",
  "thirty seven past %s",
  "thirty eight past %s",
  "thirty nine past %s",
  "twenty to %s",
  "nineteen to %s",
  "eighteen to %s",
  "seventeen to %s",
  "sixteen to %s",
  "quarter to %s",
  "fourteen to %s",
  "thirteen to %s",
  "twelve to %s",
  "eleven to %s",
  "ten to %s",
  "nine to %s",
  "eight to %s",
  "seven to %s",
  "six to %s",
  "five to %s",
  "four to %s",
  "three to %s",
  "two to %s",
  "one to %s",
];
