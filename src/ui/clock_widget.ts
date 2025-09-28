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
import { parseFuzziness } from "../utils/parse_utils.js";
import { Color } from "../models/color.js";
import { ITextClock, CLOCK_LABEL_PROPERTIES } from "../types/ui.js";
import { buildStyles } from "../utils/style/style_utils.js";

/**
 * A customizable text-based clock widget for GNOME Shell's top bar.
 *
 * TextClockLabel displays time and date information as human-readable text
 * instead of traditional digital format. It supports multiple time formats,
 * configurable fuzziness levels, optional date display, and comprehensive
 * color customization.
 *
 * Features:
 * - Text-based time display (e.g., "five past noon" instead of "12:05")
 * - Optional date and weekday display with customizable divider
 * - Multiple time formats and fuzziness levels for approximate time
 * - Individual color control for time, date, and divider elements
 * - Reactive updates when settings change
 * - Integration with GNOME Shell's theme system
 *
 * The widget is composed of three separate St.Label elements:
 * - timeLabel: Displays the text-based time
 * - dividerLabel: Shows separator between time and date
 * - dateLabel: Shows the formatted date/weekday information
 *
 * @example
 * ```typescript
 * const clockLabel = new TextClockLabel({
 *   translatePack: wordPack,
 *   showDate: true,
 *   showWeekday: true,
 *   timeFormat: TimeFormat.FORMAT_ONE,
 *   dividerText: " | "
 * });
 *
 * // Set colors
 * clockLabel.setClockColor(new Color("#FF0000"));
 * clockLabel.setDateColor(new Color("#0000FF"));
 *
 * // Update fuzziness
 * clockLabel.fuzzyMinutes = Fuzziness.QUARTER_HOUR;
 * ```
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
        "Show Date",
        "Show the date in the clock",
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
        "Show Weekday",
        "Show the day of the week in the clock",
        GObject.ParamFlags.READWRITE,
        true,
      ),
      "time-format": GObject.ParamSpec.string(
        CLOCK_LABEL_PROPERTIES.TIME_FORMAT,
        "Time Format",
        "Write the time out in this format",
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
     * Controls whether to display the date alongside the time.
     *
     * When enabled, shows formatted date information (e.g., "the 15th" or
     * "Monday the 15th") separated from the time by the configured divider text.
     *
     * @param value - True to show date, false to show time only
     */
    set showDate(value: boolean) {
      this.#showDate = value;
      this.updateClock();
    }

    /**
     * Controls whether to include the weekday name in the date display.
     *
     * Only takes effect when showDate is also enabled. When true, displays
     * weekday names like "Monday the 15th" instead of just "the 15th".
     *
     * @param value - True to include weekday name, false for date only
     */
    set showWeekday(value: boolean) {
      this.#showWeekday = value;
      this.updateClock();
    }

    /**
     * Signal handler for clock updates from GNOME Shell's WallClock.
     *
     * This setter is bound to the GnomeDesktop.WallClock's "clock" property
     * to automatically update the display when the system time changes.
     * The parameter value is ignored as it's just a trigger signal.
     *
     * @param _ - Unused clock signal value
     */
    set clockUpdate(_: string) {
      this.updateClock();
    }

    /**
     * Sets the time format for text generation.
     *
     * Controls which set of localized time expressions to use when converting
     * numerical time to text. Different formats may use alternative phrasing
     * or sentence structures for the same time values.
     *
     * @param value - TimeFormat enum value (FORMAT_ONE or FORMAT_TWO)
     */
    set timeFormat(value: TimeFormat) {
      this.#timeFormat = value;
      this.updateClock();
    }

    /**
     * Sets the localized word pack for text generation.
     *
     * The WordPack contains all localized strings needed to generate text-based
     * time and date displays. Changing this allows for language switching or
     * updating translations without recreating the widget.
     *
     * @param value - WordPack instance with localized text strings
     */
    set translatePack(value: WordPack) {
      this.#translatePack = value;
      this.#formatter.wordPack = this.#translatePack;
      this.updateClock();
    }

    /**
     * Sets the time fuzziness level for approximate time display.
     *
     * Fuzziness controls how precisely the time is displayed, rounding to
     * the nearest interval (e.g., 5 minutes, quarter hour). Higher fuzziness
     * results in more conversational but less precise time display.
     *
     * @param value - Fuzziness enum value or string representation
     */
    set fuzzyMinutes(value: Fuzziness | string) {
      this.#fuzzyMinutes = parseFuzziness(value);
      this.updateClock();
    }

    /**
     * Updates the clock display with current time and date information.
     *
     * Retrieves the current system time, formats it using the ClockFormatter
     * with current settings (fuzziness, format, date/weekday display), and
     * updates the individual label components. Called automatically when
     * settings change or time updates.
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

    /**
     * Applies current styling to all label components.
     *
     * Builds CSS styles from the current color configuration and applies
     * them to the time, date, and divider labels. Also updates the text
     * content of each label component.
     */
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

    /**
     * Sets the color for the time display portion.
     *
     * Updates the time label's color and immediately applies the new styling.
     * The color affects only the time text (e.g., "five past noon").
     *
     * @param color - Color instance for the time text
     */
    setClockColor(color: Color) {
      this.clockColor = color;
      this.applyStyling();
    }

    /**
     * Sets the color for the date display portion.
     *
     * Updates the date label's color and immediately applies the new styling.
     * The color affects only the date text (e.g., "Monday the 15th").
     *
     * @param color - Color instance for the date text
     */
    setDateColor(color: Color) {
      this.dateColor = color;
      this.applyStyling();
    }

    /**
     * Sets the color for the divider between time and date.
     *
     * Updates the divider label's color and immediately applies the new styling.
     * The color affects only the separator text (e.g., " | ").
     *
     * @param color - Color instance for the divider text
     */
    setDividerColor(color: Color) {
      this.dividerColor = color;
      this.applyStyling();
    }

    /**
     * Updates the divider text displayed between time and date.
     *
     * Changes the separator text and updates both the formatter and the
     * display. Common divider texts include " | ", " • ", or " - ".
     *
     * @param text - New divider text to display
     */
    setDividerText(text: string) {
      this.dividerText = text;
      this.#formatter.divider = text;
      this.updateClock();
    }
  },
);
