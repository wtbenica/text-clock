/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from "gi://GObject";
import St from "gi://St";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import { WordPack } from "../word_pack.js";
import { ClockFormatter, TimeFormat, Fuzziness } from "../clock_formatter.js";
import { PrefItems, Errors } from "../constants/index.js";
import { logErr } from "../utils/error-utils.js";

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
  _fuzzyMinutes: Fuzziness | string;
  _showWeekday: boolean;
  _timeFormat: string;
  timeLabel: St.Label;
  dividerLabel: St.Label;
  dateLabel: St.Label;
  clockColor: string;
  dateColor: string;
  dividerColor: string;
  setClockColor(color: string): void;
  setDateColor(color: string): void;
  setDividerColor(color: string): void;
  setDividerText(text: string): void;
}

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
    _formatter?: ClockFormatter;
    _showDate: boolean;
    _translatePack: WordPack;
    _fuzzyMinutes: Fuzziness | string;
    _showWeekday: boolean;
    _timeFormat: TimeFormat;
    timeLabel: St.Label;
    dividerLabel: St.Label;
    dateLabel: St.Label;
    clockColor: string = "#FFFFFF";
    dateColor: string = "#FFFFFF";
    dividerColor: string = "#FFFFFF";
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
      this.dividerText = props.dividerText || " | ";

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

      this._formatter = new ClockFormatter(
        this._translatePack,
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
    set fuzzyMinutes(value: Fuzziness | string) {
      // Accept either a numeric enum value or the string representation
      if (typeof value === "string") {
        const parsed = parseInt(value as string);
        if (!Number.isNaN(parsed)) {
          this._fuzzyMinutes = parsed as Fuzziness;
        } else {
          // keep as string fallback (will be parsed by formatter when needed)
          this._fuzzyMinutes = value;
        }
      } else {
        this._fuzzyMinutes = value;
      }
      this.updateClock();
    }

    /**
     * Updates the clock label text
     */
    updateClock() {
      const date = new Date();
      if (this._formatter) {
        // Normalize fuzziness to a numeric enum value if it's a string
        let fuzz: Fuzziness;
        if (typeof this._fuzzyMinutes === "string") {
          const parsed = parseInt(this._fuzzyMinutes as string);
          fuzz = Number.isNaN(parsed)
            ? Fuzziness.FIVE_MINUTES
            : (parsed as Fuzziness);
        } else {
          fuzz = this._fuzzyMinutes as Fuzziness;
        }

        const parts = this._formatter.getClockParts(
          date,
          this._showDate,
          this._showWeekday,
          this._timeFormat,
          fuzz,
        );
        this.timeText = parts.time;
        this.dividerText = parts.divider;
        this.dateText = parts.date;
        this.applyStyling();
      }
    }

    applyStyling() {
      const clockColor = this._normalizeColor(this.clockColor);
      const dateColor = this._normalizeColor(this.dateColor);
      const dividerColor = this._normalizeColor(this.dividerColor);

      (this.timeLabel as any).set_markup(
        `<span foreground="${clockColor.replace("#", "")}">${this._escapeMarkup(this.timeText)}</span>`,
      );
      (this.dateLabel as any).set_markup(
        `<span foreground="${dateColor.replace("#", "")}">${this._escapeMarkup(this.dateText)}</span>`,
      );
      (this.dividerLabel as any).set_markup(
        `<span foreground="${dividerColor.replace("#", "")}">${this._escapeMarkup(this.dividerText)}</span>`,
      );
      this.timeLabel.set_style("");
      this.dividerLabel.set_style("");
      this.dateLabel.set_style("");
    }

    _escapeMarkup(text: string) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    _normalizeColor(color: string) {
      // If color is already hex, return as-is; if rgb(...), convert to hex.
      if (!color) return "#ffffff";
      color = color.trim();
      const rgbMatch = color.match(
        /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i,
      );
      if (rgbMatch) {
        const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
        const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
        const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
        return (
          "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")
        );
      }
      // If already hex (with or without #)
      const hexMatch = color.match(/^#?[0-9a-f]{3,6}$/i);
      if (hexMatch) {
        return color.startsWith("#") ? color : `#${color}`;
      }
      return "#ffffff";
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

    setDividerText(text: string) {
      this.dividerText = text;
      if (this._formatter) {
        this._formatter.divider = text;
      }
      this.updateClock();
    }
  },
);
