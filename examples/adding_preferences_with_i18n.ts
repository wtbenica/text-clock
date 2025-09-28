/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Example: Adding new preferences with full i18n support
 *
 * This demonstrates how easy it is to add new preferences to the system
 * with proper internationalization using the unified configuration approach.
 */

import { ValuePreferenceConfig } from "../src/services/preference_configs.js";

/**
 * Example 1: Adding a new animation speed preference
 *
 * To add this to your extension:
 * 1. Add to GSettings schema: <enum id="...animation-speed">
 * 2. Add SettingsKey.ANIMATION_SPEED = "animation-speed"
 * 3. Add this config and import it in your preferences page
 * 4. Call createEnumComboRow() - that's it!
 */
export const ANIMATION_SPEED_CONFIGS: readonly ValuePreferenceConfig<number>[] =
  [
    {
      schemaValue: "instant",
      displayName: ({ _ }) => _("Instant"),
      description: ({ _ }) => _("No animation delay"),
      value: 0,
    },
    {
      schemaValue: "fast",
      displayName: ({ _ }) => _("Fast"),
      description: ({ _ }) => _("Quick animations"),
      value: 150,
    },
    {
      schemaValue: "normal",
      displayName: ({ _ }) => _("Normal"),
      description: ({ _ }) => _("Standard animation speed"),
      value: 300,
    },
    {
      schemaValue: "slow",
      displayName: ({ _ }) => _("Slow"),
      description: ({ _ }) => _("Relaxed animations"),
      value: 500,
    },
  ] as const;

/**
 * Example 2: Adding a new theme preference with mixed translation needs
 *
 * This shows how to handle cases where some options need translation
 * and others (like color names) might not.
 */
export const THEME_CONFIGS: readonly ValuePreferenceConfig<string>[] = [
  {
    schemaValue: "auto",
    displayName: ({ _ }) => _("Automatic"), // Translate this
    description: ({ _ }) => _("Follow system theme"),
    value: "auto",
  },
  {
    schemaValue: "light",
    displayName: ({ _ }) => _("Light"), // Translate this
    description: ({ _ }) => _("Force light theme"),
    value: "light",
  },
  {
    schemaValue: "dark",
    displayName: ({ _ }) => _("Dark"), // Translate this
    description: ({ _ }) => _("Force dark theme"),
    value: "dark",
  },
  {
    schemaValue: "nord",
    displayName: () => "Nord", // Don't translate theme names
    description: ({ _ }) => _("Nord color scheme"),
    value: "nord",
  },
  {
    schemaValue: "solarized",
    displayName: () => "Solarized", // Don't translate theme names
    description: ({ _ }) => _("Solarized color scheme"),
    value: "solarized",
  },
] as const;

/**
 * Example 3: Adding a clock position preference
 *
 * Shows how to use context-aware translation with pgettext
 * for words that might have different meanings in different contexts.
 */
export const CLOCK_POSITION_CONFIGS: readonly ValuePreferenceConfig<string>[] =
  [
    {
      schemaValue: "left",
      displayName: ({ pgettext }) => pgettext("position", "Left"),
      description: ({ _ }) => _("Position clock on the left side"),
      value: "left",
    },
    {
      schemaValue: "center",
      displayName: ({ pgettext }) => pgettext("position", "Center"),
      description: ({ _ }) => _("Position clock in the center"),
      value: "center",
    },
    {
      schemaValue: "right",
      displayName: ({ pgettext }) => pgettext("position", "Right"),
      description: ({ _ }) => _("Position clock on the right side"),
      value: "right",
    },
  ] as const;

/**
 * Usage in preferences page would be:
 *
 * ```typescript
 * createEnumComboRow(
 *   group,
 *   settings,
 *   SettingsKey.ANIMATION_SPEED,
 *   ANIMATION_SPEED_CONFIGS,
 *   {
 *     title: "Animation Speed",
 *     subtitle: "Control animation timing"
 *   }
 * );
 *
 * createEnumComboRow(
 *   group,
 *   settings,
 *   SettingsKey.THEME,
 *   THEME_CONFIGS,
 *   {
 *     title: "Theme",
 *     subtitle: "Choose color scheme"
 *   }
 * );
 *
 * createEnumComboRow(
 *   group,
 *   settings,
 *   SettingsKey.CLOCK_POSITION,
 *   CLOCK_POSITION_CONFIGS,
 *   {
 *     title: "Clock Position",
 *     subtitle: "Where to show the clock"
 *   }
 * );
 * ```
 *
 * That's literally all the code needed! The system handles:
 * - Translation of all text with proper gettext functions
 * - UI generation with proper GTK widgets
 * - Settings binding and change handling
 * - Type safety and validation
 * - Consistent styling and behavior
 */
