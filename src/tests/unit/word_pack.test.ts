// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { WordPack } from "../../word_pack.js";
import { TimeFormat } from "../../core/clock_formatter.js";

describe("WordPack", () => {
  let wordPack: WordPack;

  const mockData = {
    timesFormatOne: ["exactly", "five past", "ten past", "quarter past"],
    midnightFormatOne: "midnight",
    noonFormatOne: "noon",
    timesFormatTwo: ["exactly", "oh five", "ten", "fifteen"],
    midnightFormatTwo: "twelve",
    noonFormatTwo: "twelve",
    names: ["twelve", "one", "two", "three"],
    days: ["Sunday", "Monday", "Tuesday"],
    dayOnly: "the %s",
    midnight: "midnight",
    noon: "noon",
    daysOfMonth: ["1st", "2nd", "3rd"],
  };

  beforeEach(() => {
    wordPack = new WordPack(mockData);
  });

  describe("constructor", () => {
    it("should create a WordPack with all required properties", () => {
      expect(wordPack.timesFormatOne).toEqual(mockData.timesFormatOne);
      expect(wordPack.timesFormatTwo).toEqual(mockData.timesFormatTwo);
      expect(wordPack.midnightFormatOne).toBe(mockData.midnightFormatOne);
      expect(wordPack.noonFormatOne).toBe(mockData.noonFormatOne);
      expect(wordPack.midnightFormatTwo).toBe(mockData.midnightFormatTwo);
      expect(wordPack.noonFormatTwo).toBe(mockData.noonFormatTwo);
      expect(wordPack.names).toEqual(mockData.names);
      expect(wordPack.days).toEqual(mockData.days);
      expect(wordPack.dayOnly).toBe(mockData.dayOnly);
      expect(wordPack.midnight).toBe(mockData.midnight);
      expect(wordPack.noon).toBe(mockData.noon);
      expect(wordPack.daysOfMonth).toEqual(mockData.daysOfMonth);
    });
  });

  describe("getTimes", () => {
    it("should return format one times for FORMAT_ONE", () => {
      const result = wordPack.getTimes(TimeFormat.FORMAT_ONE);
      expect(result).toEqual(mockData.timesFormatOne);
    });

    it("should return format two times for FORMAT_TWO", () => {
      const result = wordPack.getTimes(TimeFormat.FORMAT_TWO);
      expect(result).toEqual(mockData.timesFormatTwo);
    });

    it("should handle null/undefined format", () => {
      const result = wordPack.getTimes(null as any);
      expect(result).toEqual(mockData.timesFormatOne);
    });
  });

  describe("validation", () => {
    it("should work with minimal required data", () => {
      const minimalData = {
        timesFormatOne: ["test"],
        midnightFormatOne: "midnight",
        noonFormatOne: "noon",
        timesFormatTwo: ["test"],
        midnightFormatTwo: "twelve",
        noonFormatTwo: "twelve",
        names: ["twelve"],
        days: ["Sunday"],
        dayOnly: "the %s",
        midnight: "midnight",
        noon: "noon",
        daysOfMonth: ["1st"],
      };

      expect(() => new WordPack(minimalData)).not.toThrow();
    });
  });
});
