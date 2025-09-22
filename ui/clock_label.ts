/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from "gi://GObject";
import Clutter from "gi://Clutter";
import St from "gi://St";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import { WordPack } from "../word_pack.js";
import { ClockFormatter, TimeFormat, Fuzziness } from "../clock_formatter.js";
import { PrefItems, Errors } from "../constants/index.js";

/**
 * The properties of the clock label
 */
export const CLOCK_LABEL_PROPERTIES = {
  SHOW_DATE: "show-date",
  CLOCK_UPDATE: "clock-update",
  TRANSLATE_PACK: "translate-pack",
  FUZZINESS: "fuzzy-minutes",
  SHOW_WEEKDAY: "show-weekday",
  TIME_FORMAT: "time-format",
};

/**
 * The interface for TextClockLabel
 */
export interface ITextClock extends St.BoxLayout {
  _showDate: boolean;
  _translatePack: WordPack;
  _fuzzyMinutes: Fuzziness;
  _showWeekday: boolean;
  _timeFormat: string;
  timeLabel: St.Label;
  dividerLabel: St.Label;
  dateLabel: St.Label;
  clockColor: string;
  dateColor: string;
  dividerColor: string;
  font: string;
  setClockColor(color: string): void;
  setDateColor(color: string): void;
  setDividerColor(color: string): void;
  setFont(font: string): void;
  setDividerText(text: string): void;
}

/**
 * A label that displays the time (and date) as text "five past noon" or "five
 * past noon | monday the 1st".
 */
export const TextClockLabel = GObject.registerClass(
  {
    GTypeName: "TextClockLabel",
    Properties: {
      "translate-pack": GObject.ParamSpec.jsobject<WordPack>(
        CLOCK_LABEL_PROPERTIES.TRANSLATE_PACK,
        "Translate Pack",
        "The translation pack",
        GObject.ParamFlags.READWRITE,
      ),
      "show-date": GObject.ParamSpec.boolean(
        CLOCK_LABEL_PROPERTIES.SHOW_DATE,
        PrefItems.SHOW_DATE.title,
        PrefItems.SHOW_DATE.subtitle,
        GObject.ParamFlags.READWRITE,
        true,
      ),
      "fuzzy-minutes": GObject.ParamSpec.uint(
        CLOCK_LABEL_PROPERTIES.FUZZINESS,
        PrefItems.FUZZINESS.title,
        PrefItems.FUZZINESS.subtitle,
        GObject.ParamFlags.READWRITE,
        Fuzziness.ONE_MINUTE,
        Fuzziness.FIFTEEN_MINUTES,
        Fuzziness.FIVE_MINUTES,
      ),
      "show-weekday": GObject.ParamSpec.boolean(
        CLOCK_LABEL_PROPERTIES.SHOW_WEEKDAY,
        PrefItems.SHOW_WEEKDAY.title,
        PrefItems.SHOW_WEEKDAY.subtitle,
        GObject.ParamFlags.READWRITE,
        true,
      ),
      "time-format": GObject.ParamSpec.string(
        CLOCK_LABEL_PROPERTIES.TIME_FORMAT,
        PrefItems.TIME_FORMAT.title,
        PrefItems.TIME_FORMAT.subtitle,
        GObject.ParamFlags.READWRITE,
        TimeFormat.FORMAT_ONE,
      ),
      "clock-update": GObject.ParamSpec.string(
        CLOCK_LABEL_PROPERTIES.CLOCK_UPDATE,
        "Clock Update",
        "The clock update signal",
        GObject.ParamFlags.READWRITE,
        "",
      ),
    },
  },
  class ClockLabel extends St.BoxLayout implements ITextClock {
    _formatter?: ClockFormatter;
    _showDate: boolean;
    _translatePack: WordPack;
    _fuzzyMinutes: Fuzziness;
    _showWeekday: boolean;
    _timeFormat: TimeFormat;
    timeLabel: St.Label;
    dividerLabel: St.Label;
    dateLabel: St.Label;
    clockColor: string = "#FFFFFF";
    dateColor: string = "#FFFFFF";
    dividerColor: string = "#FFFFFF";
    font: string = "Sans 12";
    timeText: string = "";
    dividerText: string = "";
    dateText: string = "";

    constructor(props: any) {
      super(props);
      this._translatePack = props.translatePack;
      this._showDate = props.showDate;
      this._fuzzyMinutes = props.fuzzyMinutes || Fuzziness.FIVE_MINUTES;
      this._showWeekday = props.showWeekday;
      this._timeFormat = props.timeFormat;

      // Create the three labels
      this.timeLabel = new St.Label();
      (this.timeLabel as any).use_markup = true;
      this.dividerLabel = new St.Label();
      (this.dividerLabel as any).use_markup = true;
      this.dateLabel = new St.Label();
      (this.dateLabel as any).use_markup = true;

      this.add_child(this.timeLabel);
      this.add_child(this.dividerLabel);
      this.add_child(this.dateLabel);

      try {
        this._formatter = new ClockFormatter(this._translatePack);
      } catch (error: any) {
        logError(error, _(Errors.ERROR_INITIALIZING_CLOCK_LABEL));
      }

      this.updateClock();
    }

    /**
     * Whether to show the date in the clock
     *
     * @param {boolean} value
     */
    set showDate(value: boolean) {
      this._showDate = value;
      this.updateClock();
    }

    /**
     * Whether to show the weekday as part of the date
     *
     * @param {boolean} value
     */
    set showWeekday(value: boolean) {
      this._showWeekday = value;
      this.updateClock();
    }

    /**
     * The clock update signal
     *
     * @param {string} _
     */
    set clockUpdate(_: string) {
      this.updateClock();
    }

    /**
     * THe format used to display the time
     *
     * @param {string} value
     */
    set timeFormat(value: TimeFormat) {
      this._timeFormat = value;
      this.updateClock();
    }

    /**
     * The translation pack
     *
     * @param {WordPack} value
     */
    set translatePack(value: WordPack) {
      this._translatePack = value;
      if (this._formatter) this._formatter!.wordPack = this._translatePack;
      this.updateClock();
    }

    /**
     * The fuzziness of the clock
     *
     * @param {Fuzziness} value
     */
    set fuzzyMinutes(value: Fuzziness) {
      this._fuzzyMinutes = value;
      this.updateClock();
    }

    /**
     * Updates the clock label text
     */
    updateClock() {
      try {
        const date = new Date();
        if (this._formatter) {
          const parts = this._formatter.getClockParts(
            date,
            this._showDate,
            this._showWeekday,
            this._timeFormat,
            this._fuzzyMinutes,
          );
          this.timeText = parts.time;
          this.dividerText = parts.divider;
          this.dateText = parts.date;
          this.applyStyling();
        }
      } catch (error: any) {
        logError(error, _(Errors.ERROR_UPDATING_CLOCK_LABEL));
      }
    }

    applyStyling() {
      this.timeLabel.set_text(
        `<span color="${this.clockColor}">${this.timeText}</span>`,
      );
      this.dateLabel.set_text(
        `<span color="${this.dateColor}">${this.dateText}</span>`,
      );
      this.dividerLabel.set_text(
        `<span color="${this.dividerColor}">${this.dividerText}</span>`,
      );
      const style = `font: ${this.font};`;
      this.timeLabel.set_style(style);
      this.dividerLabel.set_style(style);
      this.dateLabel.set_style(style);
    }

    setClockColor(color: string) {
      this.clockColor = color;
      this.applyStyling();
    }

    setDateColor(color: string) {
      this.dateColor = color;
      this.applyStyling();
    }

    setDividerColor(color: string) {
      this.dividerColor = color;
      this.applyStyling();
    }

    setFont(font: string) {
      this.font = font;
      this.applyStyling();
    }

    setDividerText(text: string) {
      // Update the divider text, but only if date is shown
      if (this._showDate) {
        this.dividerLabel.set_text(text);
      }
    }
  },
);
