/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Use plain `any` for GJS types in interfaces so unit tests (node) compile cleanly.
type StBoxLayout = any;
type StLabel = any;
import { Color } from "../models/color.js";

export const CLOCK_LABEL_PROPERTIES = {
  SHOW_DATE: "show-date",
  CLOCK_UPDATE: "clock-update",
  TRANSLATE_PACK: "translate-pack",
  FUZZINESS: "fuzzy-minutes",
  SHOW_WEEKDAY: "show-weekday",
  TIME_FORMAT: "time-format",
};

export interface ITextClock extends StBoxLayout {
  timeLabel: StLabel;
  dividerLabel: StLabel;
  dateLabel: StLabel;
  clockColor: Color;
  dateColor: Color;
  dividerColor: Color;
  setClockColor(color: Color): void;
  setDateColor(color: Color): void;
  setDividerColor(color: Color): void;
  setDividerText(text: string): void;
}

export interface StyleTarget {
  setClockColor(color: Color): void;
  setDateColor(color: Color): void;
  setDividerColor(color: Color): void;
  setDividerText(text: string): void;
}
