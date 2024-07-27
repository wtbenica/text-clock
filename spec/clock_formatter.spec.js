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

import { ClockFormatter, TimeFormat } from '../dist/clock_formatter.js';
import { WordPack } from '../dist/word_pack.js';
import {
  weekdays,
  dateOnly,
  daysOfMonth,
} from '../dist/constants_dates_test.js';
import {
  timesFormatOne,
  midnightFormatOne,
  noonFormatOne,
  timesFormatTwo,
  midnightFormatTwo,
  noonFormatTwo,
  midnight,
  noon,
  hourNames,
} from '../dist/constants_times_test.js';

const wordPack = new WordPack({
  timesFormatOne: timesFormatOne(),
  midnightFormatOne: midnightFormatOne(),
  noonFormatOne: noonFormatOne(),
  timesFormatTwo: timesFormatTwo(),
  midnightFormatTwo: midnightFormatTwo(),
  noonFormatTwo: noonFormatTwo(),
  names: hourNames(),
  days: weekdays(),
  dayOnly: dateOnly(),
  midnight: midnight(),
  noon: noon(),
  daysOfMonth: daysOfMonth(),
});

/**
 * A class that represents a single test case
 */
class ClockTest {
  constructor({ date, showDate }) {
    this.date = date;
    this.showDate = showDate;
  }
}

class ClockTestGroup {
  constructor({ fuzziness, timeFormat, tests, expecteds }) {
    this.fuzziness = fuzziness;
    this.timeFormat = timeFormat;
    this.tests = tests;
    this.expecteds = expecteds;
  }

  runTests() {
    if (this.tests.length !== this.expecteds.length) {
      throw new Error('Tests and expecteds must be the same length');
    }

    const clockFormatter = new ClockFormatter(wordPack);

    for (let i = 0; i < this.tests.length; i++) {
      this.#testFormatter({
        formatter: clockFormatter,
        dateTime: this.tests[i].date,
        timeFormat: this.timeFormat,
        showDate: this.tests[i].showDate,
        expected: this.expecteds[i],
        fuzziness: this.fuzziness,
      });
    }
  }

  #getMessageString({ dateTime, showDate, expected }) {
    return `${dateTime.getHours()}:${dateTime.getMinutes()} | ${
      showDate ? 'date' : 'no date'
    } => "${expected}"`;
  }

  #testFormatter({
    formatter,
    dateTime,
    timeFormat,
    showDate,
    expected,
    fuzziness,
  }) {
    const message = this.#getMessageString({
      dateTime,
      showDate,
      expected,
    });
    it(message, () => {
      const result = formatter.getClockText(
        dateTime,
        showDate,
        true,
        timeFormat,
        fuzziness,
      );
      expect(result).toBe(expected);
    });
  }
}

const tests = [
  new ClockTest({ date: new Date(2024, 6, 6, 0, 1), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 6, 23, 58), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 8, 11, 59), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 9, 12, 0), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 10, 1, 4), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 11, 2, 8), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 12, 3, 16), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 13, 4, 20), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 14, 5, 24), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 15, 6, 30), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 16, 7, 35), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 17, 8, 40), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 18, 9, 45), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 19, 10, 50), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 20, 11, 55), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 21, 12, 4), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 22, 13, 8), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 23, 14, 16), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 24, 15, 21), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 25, 16, 27), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 26, 17, 28), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 27, 18, 34), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 28, 19, 42), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 29, 20, 44), showDate: true }),
  new ClockTest({ date: new Date(2024, 6, 30, 21, 50), showDate: false }),
  new ClockTest({ date: new Date(2024, 6, 31, 22, 55), showDate: true }),
  new ClockTest({ date: new Date(2024, 7, 1, 7, 0), showDate: true }),
  new ClockTest({ date: new Date(2024, 7, 2, 0, 1), showDate: false }),
];

describe('Fuzziness: 1 | Time Format: Format One', () => {
  const fuzzy1Expecteds = [
    'one past midnight',
    'two to midnight | saturday the sixth',
    'one to noon',
    'noon | tuesday the ninth',
    'four past one',
    'eight past two | thursday the eleventh',
    'sixteen past three',
    'twenty past four | saturday the thirteenth',
    'twenty four past five',
    'half past six | monday the fifteenth',
    'twenty five to eight',
    'twenty to nine | wednesday the seventeenth',
    'quarter to ten',
    'ten to eleven | friday the nineteenth',
    'five to noon',
    'four past noon | sunday the twenty first',
    'eight past one',
    'sixteen past two | tuesday the twenty third',
    'twenty one past three',
    'twenty seven past four | thursday the twenty fifth',
    'twenty eight past five',
    'twenty six to seven | saturday the twenty seventh',
    'eighteen to eight',
    'sixteen to nine | monday the twenty ninth',
    'ten to ten',
    'five to eleven | wednesday the thirty first',
    "seven o'clock | thursday the first",
    'one past midnight',
  ];

  const testGroup1 = new ClockTestGroup({
    fuzziness: 1,
    timeFormat: TimeFormat.FORMAT_ONE,
    tests,
    expecteds: fuzzy1Expecteds,
  });

  testGroup1.runTests();
});

describe('Fuzziness: 5 | Time Format: Format One', () => {
  const fuzzy5Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    'five past one',
    'ten past two | thursday the eleventh',
    'quarter past three',
    'twenty past four | saturday the thirteenth',
    'twenty five past five',
    'half past six | monday the fifteenth',
    'twenty five to eight',
    'twenty to nine | wednesday the seventeenth',
    'quarter to ten',
    'ten to eleven | friday the nineteenth',
    'five to noon',
    'five past noon | sunday the twenty first',
    'ten past one',
    'quarter past two | tuesday the twenty third',
    'twenty past three',
    'twenty five past four | thursday the twenty fifth',
    'half past five',
    'twenty five to seven | saturday the twenty seventh',
    'twenty to eight',
    'quarter to nine | monday the twenty ninth',
    'ten to ten',
    'five to eleven | wednesday the thirty first',
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup5 = new ClockTestGroup({
    fuzziness: 5,
    timeFormat: TimeFormat.FORMAT_ONE,
    tests,
    expecteds: fuzzy5Expecteds,
  });

  testGroup5.runTests();
});

describe('Fuzziness: 10 | Time Format: Format One', () => {
  const fuzzy10Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    "one o'clock",
    'ten past two | thursday the eleventh',
    'twenty past three',
    'twenty past four | saturday the thirteenth',
    'twenty past five',
    'half past six | monday the fifteenth',
    'twenty to eight',
    'twenty to nine | wednesday the seventeenth',
    'ten to ten',
    'ten to eleven | friday the nineteenth',
    'noon',
    'noon | sunday the twenty first',
    'ten past one',
    'twenty past two | tuesday the twenty third',
    'twenty past three',
    'half past four | thursday the twenty fifth',
    'half past five',
    'half past six | saturday the twenty seventh',
    'twenty to eight',
    'twenty to nine | monday the twenty ninth',
    'ten to ten',
    "eleven o'clock | wednesday the thirty first",
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup10 = new ClockTestGroup({
    fuzziness: 10,
    timeFormat: TimeFormat.FORMAT_ONE,
    tests,
    expecteds: fuzzy10Expecteds,
  });

  testGroup10.runTests();
});

describe('Fuzziness: 15 | Time Format: Format One', () => {
  const fuzzy15Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    "one o'clock",
    'quarter past two | thursday the eleventh',
    'quarter past three',
    'quarter past four | saturday the thirteenth',
    'half past five',
    'half past six | monday the fifteenth',
    'half past seven',
    'quarter to nine | wednesday the seventeenth',
    'quarter to ten',
    'quarter to eleven | friday the nineteenth',
    'noon',
    'noon | sunday the twenty first',
    'quarter past one',
    'quarter past two | tuesday the twenty third',
    'quarter past three',
    'half past four | thursday the twenty fifth',
    'half past five',
    'half past six | saturday the twenty seventh',
    'quarter to eight',
    'quarter to nine | monday the twenty ninth',
    'quarter to ten',
    "eleven o'clock | wednesday the thirty first",
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup15 = new ClockTestGroup({
    fuzziness: 15,
    timeFormat: TimeFormat.FORMAT_ONE,
    tests,
    expecteds: fuzzy15Expecteds,
  });

  testGroup15.runTests();
});

describe('Fuzziness: 1 | Time Format: Format Two', () => {
  const fuzzy1Expecteds = [
    'twelve oh one',
    'eleven fifty eight | saturday the sixth',
    'eleven fifty nine',
    'noon | tuesday the ninth',
    'one oh four',
    'two oh eight | thursday the eleventh',
    'three sixteen',
    'four twenty | saturday the thirteenth',
    'five twenty four',
    'six thirty | monday the fifteenth',
    'seven thirty five',
    'eight forty | wednesday the seventeenth',
    'nine forty five',
    'ten fifty | friday the nineteenth',
    'eleven fifty five',
    'twelve oh four | sunday the twenty first',
    'one oh eight',
    'two sixteen | tuesday the twenty third',
    'three twenty one',
    'four twenty seven | thursday the twenty fifth',
    'five twenty eight',
    'six thirty four | saturday the twenty seventh',
    'seven forty two',
    'eight forty four | monday the twenty ninth',
    'nine fifty',
    'ten fifty five | wednesday the thirty first',
    "seven o'clock | thursday the first",
    'twelve oh one',
  ];

  const testGroup1 = new ClockTestGroup({
    fuzziness: 1,
    timeFormat: TimeFormat.FORMAT_TWO,
    tests,
    expecteds: fuzzy1Expecteds,
  });

  testGroup1.runTests();
});

describe('Fuzziness: 5 | Time Format: Format Two', () => {
  const fuzzy5Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    'one oh five',
    'two ten | thursday the eleventh',
    'three fifteen',
    'four twenty | saturday the thirteenth',
    'five twenty five',
    'six thirty | monday the fifteenth',
    'seven thirty five',
    'eight forty | wednesday the seventeenth',
    'nine forty five',
    'ten fifty | friday the nineteenth',
    'eleven fifty five',
    'twelve oh five | sunday the twenty first',
    'one ten',
    'two fifteen | tuesday the twenty third',
    'three twenty',
    'four twenty five | thursday the twenty fifth',
    'five thirty',
    'six thirty five | saturday the twenty seventh',
    'seven forty',
    'eight forty five | monday the twenty ninth',
    'nine fifty',
    'ten fifty five | wednesday the thirty first',
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup5 = new ClockTestGroup({
    fuzziness: 5,
    timeFormat: TimeFormat.FORMAT_TWO,
    tests,
    expecteds: fuzzy5Expecteds,
  });

  testGroup5.runTests();
});

describe('Fuzziness: 10 | Time Format: Format Two', () => {
  const fuzzy10Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    "one o'clock",
    'two ten | thursday the eleventh',
    'three twenty',
    'four twenty | saturday the thirteenth',
    'five twenty',
    'six thirty | monday the fifteenth',
    'seven forty',
    'eight forty | wednesday the seventeenth',
    'nine fifty',
    'ten fifty | friday the nineteenth',
    'noon',
    'noon | sunday the twenty first',
    'one ten',
    'two twenty | tuesday the twenty third',
    'three twenty',
    'four thirty | thursday the twenty fifth',
    'five thirty',
    'six thirty | saturday the twenty seventh',
    'seven forty',
    'eight forty | monday the twenty ninth',
    'nine fifty',
    "eleven o'clock | wednesday the thirty first",
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup10 = new ClockTestGroup({
    fuzziness: 10,
    timeFormat: TimeFormat.FORMAT_TWO,
    tests,
    expecteds: fuzzy10Expecteds,
  });

  testGroup10.runTests();
});

describe('Fuzziness: 15 | Time Format: Format Two', () => {
  const fuzzy15Expecteds = [
    'midnight',
    'midnight | sunday the seventh',
    'noon',
    'noon | tuesday the ninth',
    "one o'clock",
    'two fifteen | thursday the eleventh',
    'three fifteen',
    'four fifteen | saturday the thirteenth',
    'five thirty',
    'six thirty | monday the fifteenth',
    'seven thirty',
    'eight forty five | wednesday the seventeenth',
    'nine forty five',
    'ten forty five | friday the nineteenth',
    'noon',
    'noon | sunday the twenty first',
    'one fifteen',
    'two fifteen | tuesday the twenty third',
    'three fifteen',
    'four thirty | thursday the twenty fifth',
    'five thirty',
    'six thirty | saturday the twenty seventh',
    'seven forty five',
    'eight forty five | monday the twenty ninth',
    'nine forty five',
    "eleven o'clock | wednesday the thirty first",
    "seven o'clock | thursday the first",
    'midnight',
  ];

  const testGroup15 = new ClockTestGroup({
    fuzziness: 15,
    timeFormat: TimeFormat.FORMAT_TWO,
    tests,
    expecteds: fuzzy15Expecteds,
  });

  testGroup15.runTests();
});
