// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Style utilities for generating CSS styles for text clock elements.
 *
 * This module provides functions for converting Color objects into CSS
 * style strings that can be applied to GNOME Shell's St.Label widgets.
 * It handles the formatting and composition of styles for different
 * UI elements in the text clock display.
 *
 * @example
 * ```typescript
 * import { buildStyles } from './style_utils.js';
 * import { Color } from '../../models/color.js';
 *
 * const timeColor = new Color('#3584E4');
 * const dateColor = new Color('#C0BFBC');
 * const dividerColor = new Color('#FFFFFF');
 *
 * const styles = buildStyles(timeColor, dateColor, dividerColor);
 * // Apply to St.Label widgets
 * timeLabel.set_style(styles.timeStyle);
 * dateLabel.set_style(styles.dateStyle);
 * dividerLabel.set_style(styles.dividerStyle);
 * ```
 */

import { Color } from "../../domain/models/color.js";

/**
 * CSS style strings for different text clock display elements.
 *
 * Contains the complete CSS style strings that can be directly applied
 * to St.Label widgets in GNOME Shell. Each style includes appropriate
 * color and formatting properties for its respective UI element.
 */
export interface StylePresentation {
  /** CSS style string for the time display portion */
  timeStyle: string;

  /** CSS style string for the divider between time and date */
  dividerStyle: string;

  /** CSS style string for the date display portion */
  dateStyle: string;
}

/**
 * Build CSS style strings for text clock elements from Color objects.
 *
 * Converts Color instances into complete CSS style strings that can be
 * applied to GNOME Shell's St.Label widgets. The divider style includes
 * additional font-weight styling to make it visually distinct.
 *
 * @param clockColor - Color for the time display text
 * @param dateColor - Color for the date display text
 * @param dividerColor - Color for the divider text between time and date
 * @returns StylePresentation object with CSS strings for each element
 *
 * @example
 * ```typescript
 * const timeColor = new Color('#FF0000');     // Red
 * const dateColor = new Color('#00FF00');     // Green
 * const dividerColor = new Color('#0000FF');  // Blue
 *
 * const styles = buildStyles(timeColor, dateColor, dividerColor);
 * // Result:
 * // {
 * //   timeStyle: 'color: #ff0000;',
 * //   dateStyle: 'color: #00ff00;',
 * //   dividerStyle: 'color: #0000ff; font-weight: bold;'
 * // }
 *
 * // Apply to UI elements
 * clockLabel.timeLabel.set_style(styles.timeStyle);
 * clockLabel.dateLabel.set_style(styles.dateStyle);
 * clockLabel.dividerLabel.set_style(styles.dividerStyle);
 * ```
 */
export function buildStyles(
  clockColor: Color,
  dateColor: Color,
  dividerColor: Color,
): StylePresentation {
  return {
    timeStyle: `color: ${clockColor.toString()};`,
    dateStyle: `color: ${dateColor.toString()};`,
    dividerStyle: `color: ${dividerColor.toString()}; font-weight: bold;`,
  };
}

export default buildStyles;
