/*
 * Copyright (c) 2024 Wesley Benica
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

import GObject from "gi://GObject";
import Clutter from "gi://Clutter";
import St from "gi://St";

import { ClockFormatter } from "../clock_formatter.js";
import { WordPack } from "../word_pack.js";

export const PROPERTIES = {
  SHOW_DATE: "show-date",
  CLOCK_UPDATE: "clock-update",
  TRANSLATE_PACK: "translate-pack",
  FUZZINESS: "fuzzy-minutes",
};

export interface ITextClock extends Clutter.Actor {
  _showDate?: boolean;
  _translatePack?: WordPack;
  _fuzzyMinutes?: number;
}

/**
 * A label that displays the time (and date) as text "five past noon" or "five
 * past noon | monday the 1st".
 */
export const TextClockLabel = GObject.registerClass(
  {
    GTypeName: "TextClockLabelTS",
    Properties: {
      "show-date": GObject.ParamSpec.boolean(
        PROPERTIES.SHOW_DATE,
        "Show Date",
        "Whether to show the date",
        GObject.ParamFlags.READWRITE,
        true
      ),
      "clock-update": GObject.ParamSpec.string(
        PROPERTIES.CLOCK_UPDATE,
        "Clock Update",
        "The clock update signal",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      "fuzzy-minutes": GObject.ParamSpec.string(
        PROPERTIES.FUZZINESS,
        "Fuzziness",
        "The fuzziness of the clock",
        GObject.ParamFlags.READWRITE,
        "5"
      ),
      "translate-pack": GObject.ParamSpec.jsobject<WordPack>(
        PROPERTIES.TRANSLATE_PACK,
        "Translate Pack",
        "The translation pack",
        GObject.ParamFlags.READWRITE
      ),
    },
  },
  class ClockLabel extends St.Label implements ITextClock {
    _formatter?: ClockFormatter;
    _showDate?: boolean;
    _translatePack?: WordPack;
    _fuzzyMinutes?: number;

    constructor(props: any) {
      super(props);
      console.log(
        `Give me props: ${props.showDate} | ${props.translatePack} | ${props.fuzzyMinutes}`
      );
      this._showDate = props.showDate;
      this._translatePack = props.translatePack;
      this._fuzzyMinutes = props.fuzzyMinutes;

      console.log(
        `this._fuzziness ${this._fuzzyMinutes} | props.fuzziness ${
          props.fuzzyMinutes
        } | ${typeof props.fuzzyMinutes}`
      );

      try {
        console.log("CALLING constructor new ClockFormatter");
        console.log(
          `this._translatePack ? ${
            this._translatePack === null
              ? "null"
              : this._translatePack === undefined
              ? "undefined"
              : "good"
          }`
        );
        console.log(`this._fuzziness ? ${this._fuzzyMinutes}`);
        this._formatter = new ClockFormatter(
          this._translatePack!,
          this._fuzzyMinutes
        );
        this.clutterText.yAlign = Clutter.ActorAlign.CENTER;
      } catch (error: any) {
        logError(error, "Error initializing clock label");
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
     * The clock update signal
     * @param {any} _
     */
    set clockUpdate(_: any) {
      console.log("CALLING clockUpdate");
      this.updateClock();
    }

    /**
     * The translation pack
     * @param {WordPack} value
     */
    set translatePack(value: WordPack) {
      this._translatePack = value;
      this._formatter!.wordPack = this._translatePack;
      this.updateClock();
    }

    /**
     * The fuzziness of the clock
     * @param {string} value
     */
    set fuzzyMinutes(value: string) {
      console.log(`CALLING fuzziness ${value}`);
      this._fuzzyMinutes = parseInt(value);
      this._formatter!.fuzziness = this._fuzzyMinutes;
      this.updateClock();
    }

    /**
     * Updates the clock label text
     */
    updateClock() {
      console.log("CALLING updateClock");
      try {
        const date = new Date();
        this.set_text(this._formatter?.getClockText(date, this._showDate!));
      } catch (error: any) {
        logError(error, "Error updating clock label");
      }
    }
  }
);
