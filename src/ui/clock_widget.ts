/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from "gi://GObject";
import St from "gi://St";
import { WordPack } from "../word_pack.js";
import {
  ClockFormatter,
  TimeFormat,
  Fuzziness,
} from "../core/clock_formatter.js";
import { PrefItems } from "../constants/index.js";
import { parseFuzziness } from "../utils/parse";
import { Color } from "../models/color.js";
import { ITextClock, CLOCK_LABEL_PROPERTIES } from "../types/ui.js";
import { buildStyles } from "../utils/style";

/**
 * A label that displays the time (and date) as text "five past noon" or "five
 * past noon | monday the 1st".
 */
export const TextClockLabel = GObject.registerClass(
  {
    GTypeName: "TextClockLabelV2",
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
      "fuzzy-minutes": GObject.ParamSpec.string(
        CLOCK_LABEL_PROPERTIES.FUZZINESS,
        "Fuzziness",
        "The fuzziness of the clock",
        GObject.ParamFlags.READWRITE,
        "5",
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
      "divider-text": GObject.ParamSpec.string(
        "divider-text",
        "Divider Text",
        "The text used to divide time and date",
        GObject.ParamFlags.READWRITE,
        " | ",
      ),
    },
  },
  class ClockLabel extends St.BoxLayout implements ITextClock {
    #formatter: ClockFormatter;
    #showDate: boolean;
    #translatePack: WordPack;
    #fuzzyMinutes: Fuzziness;
    #showWeekday: boolean;
    #timeFormat: TimeFormat;
    timeLabel: St.Label;
    dividerLabel: St.Label;
    dateLabel: St.Label;
    clockColor: Color = new Color("#FFFFFF");
    dateColor: Color = new Color("#FFFFFF");
    dividerColor: Color = new Color("#FFFFFF");
    timeText: string = "";
    dividerText: string = "";
    dateText: string = "";

    constructor(props: any) {
      super(props);
      this.#translatePack = props.translatePack;
      this.#showDate = props.showDate;
      this.#fuzzyMinutes = parseFuzziness(
        props.fuzzyMinutes || Fuzziness.FIVE_MINUTES,
      );
      this.#showWeekday = props.showWeekday;
      this.#timeFormat = props.timeFormat;
      this.dividerText = props.dividerText || " | ";

      // Create the three labels
      this.timeLabel = new St.Label();
      this.dividerLabel = new St.Label();
      this.dateLabel = new St.Label();

      this.add_child(this.timeLabel);
      this.add_child(this.dividerLabel);
      this.add_child(this.dateLabel);

      this.#formatter = new ClockFormatter(
        this.#translatePack,
        this.dividerText,
      );

      this.updateClock();
    }

    /**
     * Whether to show the date in the clock
     *
     * @param {boolean} value
     */
    set showDate(value: boolean) {
      this.#showDate = value;
      this.updateClock();
    }

    /**
     * Whether to show the weekday as part of the date
     *
     * @param {boolean} value
     */
    set showWeekday(value: boolean) {
      this.#showWeekday = value;
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
      this.#timeFormat = value;
      this.updateClock();
    }

    /**
     * The translation pack
     *
     * @param {WordPack} value
     */
    set translatePack(value: WordPack) {
      this.#translatePack = value;
      this.#formatter.wordPack = this.#translatePack;
      this.updateClock();
    }

    /**
     * The fuzziness of the clock
     *
     * @param {Fuzziness} value
     */
    set fuzzyMinutes(value: Fuzziness | string) {
      this.#fuzzyMinutes = parseFuzziness(value);
      this.updateClock();
    }

    /**
     * Updates the clock label text
     */
    updateClock() {
      const date = new Date();
      const parts = this.#formatter.getPresentation(
        date,
        this.#showDate,
        this.#showWeekday,
        this.#timeFormat,
        this.#fuzzyMinutes,
      );
      this.timeText = parts.time;
      this.dividerText = parts.divider;
      this.dateText = parts.date;
      this.applyStyling();
    }

    applyStyling() {
      const styles = buildStyles(
        this.clockColor,
        this.dateColor,
        this.dividerColor,
      );

      this.timeLabel.set_text(this.timeText);
      this.timeLabel.set_style(styles.timeStyle);

      this.dateLabel.set_text(this.dateText);
      this.dateLabel.set_style(styles.dateStyle);

      this.dividerLabel.set_text(this.dividerText);
      this.dividerLabel.set_style(styles.dividerStyle);
    }

    setClockColor(color: Color) {
      this.clockColor = color;
      this.applyStyling();
    }

    setDateColor(color: Color) {
      this.dateColor = color;
      this.applyStyling();
    }

    setDividerColor(color: Color) {
      this.dividerColor = color;
      this.applyStyling();
    }

    setDividerText(text: string) {
      this.dividerText = text;
      this.#formatter.divider = text;
      this.updateClock();
    }
  },
);
