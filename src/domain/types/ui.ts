// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * User interface type definitions and constants for the Text Clock extension.
 *
 * This module defines TypeScript interfaces and constants for UI components,
 * particularly focusing on the clock widget and styling system. It provides
 * type safety for GNOME Shell UI components while maintaining compatibility
 * with the testing environment.
 *
 * The types use `any` for GJS-specific types to ensure unit tests compile
 * cleanly in Node.js environments where GNOME Shell types are not available.
 *
 * @example
 * ```
 * // Implement the clock widget interface
 * class TextClockWidget implements ITextClock {
 *   // ... implementation
 * }
 *
 * // Use property constants
 * const showDateProp = CLOCK_LABEL_PROPERTIES.SHOW_DATE;
 * ```
 */

// Use plain `any` for GJS types in interfaces so unit tests (node) compile cleanly.
type StBoxLayout = any;
type StLabel = any;
import { Color } from "../models/color.js";

/**
 * Property names used for the clock widget's GObject properties.
 *
 * These constants define the string keys used for GObject property binding
 * and signal emission in the clock widget. They ensure consistency across
 * the codebase and provide a single source of truth for property names.
 */
export const CLOCK_LABEL_PROPERTIES = {
  /** Property name for show-date boolean setting */
  SHOW_DATE: "show-date",

  /** Property name for clock update signals */
  CLOCK_UPDATE: "clock-update",

  /** Property name for translation pack updates */
  TRANSLATE_PACK: "translate-pack",

  /** Property name for fuzziness/rounding setting */
  FUZZINESS: "fuzzy-minutes",

  /** Property name for show-weekday boolean setting */
  SHOW_WEEKDAY: "show-weekday",

  /** Property name for time format enum setting */
  TIME_FORMAT: "time-format",
};

/**
 * Interface for the main text clock widget component.
 *
 * Extends the GNOME Shell StBoxLayout to define the complete API for the
 * text clock widget. Includes references to child UI elements, color state,
 * and methods for updating the widget's appearance.
 *
 * This interface provides type safety for the complex clock widget while
 * maintaining compatibility with GNOME Shell's GObject-based UI system.
 *
 * @example
 * ```
 * class TextClockLabel extends StBoxLayout implements ITextClock {
 *   // ... property declarations and method implementations
 * }
 * ```
 */
export interface ITextClock extends StBoxLayout {
  /** Label widget displaying the time text */
  timeLabel: StLabel;

  /** Label widget displaying the divider between time and date */
  dividerLabel: StLabel;

  /** Label widget displaying the date text */
  dateLabel: StLabel;

  /** Current color applied to the clock/time display */
  clockColor: Color;

  /** Current color applied to the date display */
  dateColor: Color;

  /** Current color applied to the divider */
  dividerColor: Color;

  /** Apply the specified color to the clock/time text elements */
  setClockColor(color: Color): void;

  /** Apply the specified color to the date text elements */
  setDateColor(color: Color): void;

  /** Apply the specified color to the divider elements */
  setDividerColor(color: Color): void;

  /** Update the text content of the divider */
  setDividerText(text: string): void;
}

/**
 * Interface for UI components that can receive style updates from the StyleService.
 *
 * Defines the contract for objects that can be automatically updated when
 * style-related settings change. UI components implementing this interface
 * can be registered with the StyleService to receive reactive color and
 * text updates.
 *
 * This interface enables a clean separation between style management logic
 * and UI component implementation, allowing for consistent styling across
 * different widget types.
 *
 * @example
 * ```
 * class CustomClockWidget implements StyleTarget {
 *   // ... method implementations for color and text updates
 * }
 *
 * // Register with StyleService for automatic updates
 * styleService.registerTarget(customWidget);
 * ```
 */
export interface StyleTarget {
  /** Apply the specified color to clock text elements */
  setClockColor(color: Color): void;

  /** Apply the specified color to date text elements */
  setDateColor(color: Color): void;

  /** Apply the specified color to divider elements */
  setDividerColor(color: Color): void;

  /** Update the divider text content */
  setDividerText(text: string): void;
}
