/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Color } from "./color.js";
import type { GettextFunctions } from "../utils/gettext/gettext_utils.js";

/**
 * Type definitions for preference configuration system.
 *
 * This module defines the interfaces and types used throughout the preference
 * configuration system. These types enable type-safe preference definitions
 * and automatic UI generation.
 */

/**
 * Base interface for all preference option configurations.
 *
 * Provides the minimum data structure needed for any preference option,
 * including schema enum information and UI display data with i18n support.
 */
export interface BasePreferenceConfig {
  /** Schema enum string value that matches GSettings schema definition */
  schemaValue: string;

  /** Function that returns localized display name for UI */
  displayName: (gettext: GettextFunctions) => string;

  /** Function that returns localized description for tooltips/subtitles */
  description: (gettext: GettextFunctions) => string;
}

/**
 * Configuration for preferences that have actual runtime values.
 *
 * Extends BasePreferenceConfig with the actual value used by the extension
 * when this option is selected.
 */
export interface ValuePreferenceConfig<T> extends BasePreferenceConfig {
  /** The actual value used by the extension when this option is selected */
  value: T;
}

/**
 * Configuration for preferences that have custom behavior.
 *
 * Some preferences (like custom divider text) don't have fixed values
 * but instead use user-provided input or computed values.
 */
export interface CustomPreferenceConfig extends BasePreferenceConfig {
  /** Indicates this option uses custom/user-provided values */
  isCustom: true;
}

/**
 * Configuration for accent color style variations.
 *
 * Defines color transformation functions for different visual accent styles,
 * allowing flexible color schemes while maintaining consistent theming.
 */
export interface AccentStyleConfig extends BasePreferenceConfig {
  /** Function to transform base accent color for clock text */
  clockColor: (accent: Color) => Color;

  /** Function to transform base accent color for date text */
  dateColor: (accent: Color) => Color;

  /** Function to transform base accent color for divider text */
  dividerColor: (accent: Color) => Color;
}
