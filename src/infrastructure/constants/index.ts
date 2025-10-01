// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Shared top-level constants used across the Text Clock extension.
 *
 * This module centralizes all extension constants including error messages
 * and utility functions. It provides a single source of truth for configuration
 * arrays and type definitions used throughout the extension.
 *
 * The constants support:
 * - Centralized error message definitions
 * - GSettings enum index to value mappings
 * - Color mode and accent style configurations
 * - Divider text utility functions
 *
 * @example
 * ```typescript
 * import { Errors, getDividerText } from './constants/index.js';
 *
 * // Error messages
 * console.error(Errors.ERROR_INVALID_TIME_FORMAT);
 *
 * // Divider text generation
 * const divider = getDividerText(1, '→');
 *
 * // Dynamic divider text
 * const divider = getDividerText(0, ''); // " | " (pipe preset)
 * ```
 */

/**
 * Centralized error message definitions for the extension.
 *
 * Provides consistent, descriptive error messages used throughout the
 * extension for logging and debugging. Centralizing error messages
 * ensures consistency and makes them easier to maintain and localize.
 */
export const Errors: Record<string, string> = {
  ERROR_RETRIEVE_DATE_MENU: "Error retrieving date menu",
  ERROR_PLACING_CLOCK_LABEL: "Error placing clock label",
  ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL:
    "Error binding settings to clock label",
  ERROR_INITIALIZING_CLOCK_LABEL: "Error initializing clock label",
  ERROR_UPDATING_CLOCK_LABEL: "Error updating clock label",
  ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX: "Could not find clock display box",
  ERROR_BINDING_SETTINGS_FOR_: "Error binding settings for",
  ERROR_UNABLE_TO_FORMAT_TIME_STRING: "Unable to format time string",
  ERROR_UNABLE_TO_FORMAT_DATE_STRING: "Unable to format date string",
  ERROR_INVALID_TIME_FORMAT: "Invalid time format",
};

/**
 * Re-export divider text function for backward compatibility.
 *
 * @param presetIndex - GSettings enum index for divider preset
 * @param customText - Custom divider text when preset is "custom"
 * @returns The actual divider text to display
 */
export { getDividerText } from "../../application/services/preference_configs.js";
