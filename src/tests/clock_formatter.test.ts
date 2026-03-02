import { ClockFormatter } from "../core/clock_formatter.js";
import { CustomMessage } from "../models/custom_message.js";

describe("ClockFormatter - Custom Messages", () => {
  const mockWordPack = {
    getTimes: jest.fn(() => {
      return Array(60)
        .fill(null)
        .map((_, i) => `Time ${i}`);
    }),
    timesFormatOne: [],
    midnightFormatOne: "midnight",
    noonFormatOne: "noon",
    timesFormatTwo: [],
    midnightFormatTwo: "midnight",
    noonFormatTwo: "noon",
    names: [],
    days: [],
    dayNames: [],
    dayOnly: "",
    midnight: "midnight",
    noon: "noon",
    daysOfMonth: [],
  };
  const formatter = new ClockFormatter(mockWordPack);

  it("should display a one-time custom message", () => {
    const messages: CustomMessage[] = [
      { date: "2026-03-01", message: "Happy Birthday!" },
    ];
    const result = formatter.formatClockDisplay(
      new Date("2026-03-01"),
      messages,
    );
    expect(result).toBe("Happy Birthday!");
  });

  it("should display a yearly recurring custom message", () => {
    const messages: CustomMessage[] = [
      { date: "2020-03-01", recurrence: "yearly", message: "Anniversary!" },
    ];
    const result = formatter.formatClockDisplay(
      new Date("2026-03-01"),
      messages,
    );
    expect(result).toBe("Anniversary!");
  });

  it("should display a monthly recurring custom message", () => {
    const messages: CustomMessage[] = [
      { date: "2026-03-15", recurrence: "monthly", message: "Payday!" },
    ];
    const result = formatter.formatClockDisplay(
      new Date("2026-03-15"),
      messages,
    );
    expect(result).toBe("Payday!");
  });

  it("should not display a message if no match is found", () => {
    const messages: CustomMessage[] = [
      { date: "2026-03-02", message: "Event!" },
    ];
    const result = formatter.formatClockDisplay(
      new Date("2026-03-01"),
      messages,
    );
    expect(result).not.toBe("Event!");
  });
});
