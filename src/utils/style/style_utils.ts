// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Style utilities for generating CSS styles for text clock elements.
 */

import { Color } from "../../models/color.js";

/**
 * CSS style strings for text clock display elements.
 */
export interface StylePresentation {
  timeStyle: string;
  dividerStyle: string;
  dateStyle: string;
}

/**
 * Build CSS style strings for text clock elements from Color objects.
 */
export function buildStyles(
  clockColor: Color,
  dateColor: Color,
  dividerColor: Color,
): StylePresentation {
  return {
    timeStyle: `color: ${clockColor.toString()};`,
    dateStyle: `color: ${dateColor.toString()};`,
    dividerStyle: `color: ${dividerColor.toString()};`,
  };
}

export default buildStyles;
