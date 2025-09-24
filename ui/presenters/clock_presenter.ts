/*
 * Pure presenter for clock formatting and style computation.
 * This module contains no GJS imports so it is easy to unit-test.
 */

import { WordPack } from "../../word_pack.js";
import {
  ClockFormatter,
  TimeFormat,
  Fuzziness,
} from "../../core/clock_formatter.js";
import { Color } from "../../models/color.js";
import { buildStyles } from "../../utils/style_utils.js";

export interface ClockPresentation {
  time: string;
  divider: string;
  date: string;
}

export interface ClockPresenterOptions {
  translatePack: WordPack;
  showDate?: boolean;
  showWeekday?: boolean;
  timeFormat?: TimeFormat;
  fuzzyMinutes?: Fuzziness | string;
  dividerText?: string;
}

export class ClockPresenter {
  _formatter: ClockFormatter;
  showDate: boolean;
  showWeekday: boolean;
  timeFormat: TimeFormat;
  fuzzyMinutes: Fuzziness;
  translatePack: WordPack;

  constructor(opts: ClockPresenterOptions) {
    this.translatePack = opts.translatePack;
    this.showDate = opts.showDate ?? true;
    this.showWeekday = opts.showWeekday ?? true;
    this.timeFormat = opts.timeFormat ?? (TimeFormat as any).FORMAT_ONE;
    this.fuzzyMinutes =
      (opts.fuzzyMinutes as any) ?? (Fuzziness as any).FIVE_MINUTES;
    const divider = opts.dividerText || " | ";

    this._formatter = new ClockFormatter(this.translatePack, divider);
  }

  setTranslatePack(pack: WordPack) {
    this.translatePack = pack;
    this._formatter.wordPack = pack;
  }

  setShowDate(value: boolean) {
    this.showDate = value;
  }

  setShowWeekday(value: boolean) {
    this.showWeekday = value;
  }

  setTimeFormat(value: TimeFormat) {
    this.timeFormat = value;
  }

  setFuzziness(value: Fuzziness | string) {
    this.fuzzyMinutes = value as Fuzziness;
  }

  setDividerText(text: string) {
    this._formatter.divider = text;
  }

  /**
   * Compute the textual presentation for the current time (or provided date)
   */
  present(now?: Date): ClockPresentation {
    const date = now || new Date();
    const parts = this._formatter.getClockParts(
      date,
      this.showDate,
      this.showWeekday,
      this.timeFormat,
      this.fuzzyMinutes as any,
    );

    return {
      time: parts.time,
      divider: parts.divider,
      date: parts.date,
    };
  }

  /**
   * Build CSS style strings for the provided colors
   */
  buildStyles(clockColor: Color, dateColor: Color, dividerColor: Color) {
    return buildStyles(clockColor, dateColor, dividerColor);
  }
}

export default ClockPresenter;
