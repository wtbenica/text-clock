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
import { parseFuzziness } from "../utils/fuzziness_utils.js";
import { Color } from "../models/color.js";
import { ITextClock, CLOCK_LABEL_PROPERTIES } from "../types/ui.js";
import { ClockPresenter } from "./presenters/clock_presenter.js";

export const TextClockWidget = GObject.registerClass(
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
  class ClockWidget extends St.BoxLayout implements ITextClock {
    _formatter?: ClockFormatter;
    _presenter?: ClockPresenter;
    _showDate: boolean;
    _translatePack: WordPack;
    _fuzzyMinutes: Fuzziness;
    _showWeekday: boolean;
    _timeFormat: TimeFormat;
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
      this._translatePack = props.translatePack;
      this._showDate = props.showDate;
      this._fuzzyMinutes = parseFuzziness(
        props.fuzzyMinutes || Fuzziness.FIVE_MINUTES,
      );
      this._showWeekday = props.showWeekday;
      this._timeFormat = props.timeFormat;
      this.dividerText = props.dividerText || " | ";

      // Create the three labels
      this.timeLabel = new St.Label();
      this.dividerLabel = new St.Label();
      this.dateLabel = new St.Label();

      this.add_child(this.timeLabel);
      this.add_child(this.dividerLabel);
      this.add_child(this.dateLabel);

      this._presenter = new ClockPresenter({
        translatePack: this._translatePack,
        showDate: this._showDate,
        showWeekday: this._showWeekday,
        timeFormat: this._timeFormat,
        fuzzyMinutes: this._fuzzyMinutes,
        dividerText: this.dividerText,
      });

      this.updateClock();
    }

    set showDate(value: boolean) {
      this._showDate = value;
      this.updateClock();
    }

    set showWeekday(value: boolean) {
      this._showWeekday = value;
      this.updateClock();
    }

    set clockUpdate(_: string) {
      this.updateClock();
    }

    set timeFormat(value: TimeFormat) {
      this._timeFormat = value;
      this.updateClock();
    }

    set translatePack(value: WordPack) {
      this._translatePack = value;
      if (this._formatter) this._formatter!.wordPack = this._translatePack;
      this.updateClock();
    }

    set fuzzyMinutes(value: Fuzziness | string) {
      this._fuzzyMinutes = parseFuzziness(value);
      this.updateClock();
    }

    updateClock() {
      const date = new Date();
      if (this._presenter) {
        const parts = this._presenter.present(date);
        this.timeText = parts.time;
        this.dividerText = parts.divider;
        this.dateText = parts.date;
        this.applyStyling();
      }
    }

    applyStyling() {
      const styles = this._presenter
        ? this._presenter.buildStyles(
            this.clockColor,
            this.dateColor,
            this.dividerColor,
          )
        : {
            timeStyle: `color: ${this.clockColor.toString()};`,
            dateStyle: `color: ${this.dateColor.toString()};`,
            dividerStyle: `color: ${this.dividerColor.toString()};`,
          };

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
      if (this._formatter) {
        this._formatter.divider = text;
      }
      this.updateClock();
    }
  },
);

export default TextClockWidget;

// ...existing code moved from ui/clock_label.ts ...
// canonical snake_case implementation - old kebab-case file removed
