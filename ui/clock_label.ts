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
export interface ITextClock extends Clutter.Actor {
  _showDate: boolean;
  _translatePack: WordPack;
  _fuzzyMinutes: Fuzziness;
  _showWeekday: boolean;
  _timeFormat: string;
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
  class ClockLabel extends St.Label implements ITextClock {
    _formatter?: ClockFormatter;
    _showDate: boolean;
    _translatePack: WordPack;
    _fuzzyMinutes: Fuzziness;
    _showWeekday: boolean;
    _timeFormat: TimeFormat;

    constructor(props: any) {
      super(props);
      this._translatePack = props.translatePack;
      this._showDate = props.showDate;
      this._fuzzyMinutes = props.fuzzyMinutes || Fuzziness.FIVE_MINUTES;
      this._showWeekday = props.showWeekday;
      this._timeFormat = props.timeFormat;

      try {
        this._formatter = new ClockFormatter(this._translatePack);
        this.clutterText.yAlign = Clutter.ActorAlign.CENTER;
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
        if (this._formatter)
          this.set_text(
            this._formatter?.getClockText(
              date,
              this._showDate,
              this._showWeekday,
              this._timeFormat,
              this._fuzzyMinutes,
            ),
          );
      } catch (error: any) {
        logError(error, _(Errors.ERROR_UPDATING_CLOCK_LABEL));
      }
    }
  },
);
