/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Service responsible for managing extension styles and colors
 *
 * This service centralizes all color and style-related operations,
 * providing a clean interface for applying styles to UI elements.
 */

import Gio from "gi://Gio";
import { normalizeColor } from "../utils/color_utils.js";
import { logWarn } from "../utils/error_utils.js";
import { getDividerText } from "../constants/index.js";
import SettingsKey from "../models/settings_keys";
import { Color } from "../models/color.js";

/**
 * Configuration for styling elements
 */
export interface StyleConfig {
  clockColor?: Color;
  dateColor?: Color;
  dividerColor?: Color;
  dividerText?: string;
}

/**
 * Interface for objects that can receive style updates
 */
export interface StyleTarget {
  setClockColor(color: Color): void;
  setDateColor(color: Color): void;
  setDividerColor(color: Color): void;
  setDividerText(text: string): void;
}

/**
 * Service for managing styles and colors throughout the extension
 */
export class StyleService {
  #settings: Gio.Settings;
  #targets: Set<StyleTarget> = new Set();
  #signalConnections: number[] = [];

  constructor(settings: Gio.Settings) {
    this.#settings = settings;
    this.#connectToSettings();
  }

  /**
   * Register a target to receive style updates
   */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.#applyCurrentStyles(target);
  }

  /**
   * Unregister a target from receiving style updates
   */
  unregisterTarget(target: StyleTarget): void {
    this.#targets.delete(target);
  }

  /**
   * Apply styles to a specific target
   */
  applyStyles(target: StyleTarget, config?: StyleConfig): void {
    const effectiveConfig = config || this.#getCurrentStyleConfig();

    if (effectiveConfig.clockColor) {
      target.setClockColor(effectiveConfig.clockColor);
    }
    if (effectiveConfig.dateColor) {
      target.setDateColor(effectiveConfig.dateColor);
    }
    if (effectiveConfig.dividerColor) {
      target.setDividerColor(effectiveConfig.dividerColor);
    }
    if (effectiveConfig.dividerText) {
      target.setDividerText(effectiveConfig.dividerText);
    }
  }

  /**
   * Apply current styles to all registered targets
   */
  applyToAllTargets(): void {
    const config = this.#getCurrentStyleConfig();
    for (const target of this.#targets) {
      this.applyStyles(target, config);
    }
  }

  /**
   * Get the current style configuration from settings
   */
  getCurrentStyles(): StyleConfig {
    return this.#getCurrentStyleConfig();
  }

  /**
   * Validate and normalize a color value
   */
  validateColor(color: string, fallback: string = "#FFFFFF"): string {
    try {
      return normalizeColor(color);
    } catch (err) {
      logWarn(`Invalid color "${color}", using fallback "${fallback}": ${err}`);
      return fallback;
    }
  }

  /**
   * Get the system's accent color
   */
  getAccentColor(): Color {
    // Use GNOME Shell's built-in accent color CSS custom property
    // -st-accent-color is available in GNOME Shell 47+
    return new Color("-st-accent-color");
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Disconnect all settings signals
    for (const connectionId of this.#signalConnections) {
      this.#settings.disconnect(connectionId);
    }
    this.#signalConnections = [];

    // Clear all targets
    this.#targets.clear();
  }

  // Private methods

  /**
   * Connect to settings changes to automatically update styles
   */
  #connectToSettings(): void {
    const colorSettings = [
      SettingsKey.COLOR_MODE,
      SettingsKey.CLOCK_COLOR,
      SettingsKey.DATE_COLOR,
      SettingsKey.DIVIDER_COLOR,
      SettingsKey.DIVIDER_PRESET,
      SettingsKey.CUSTOM_DIVIDER_TEXT,
    ];

    for (const setting of colorSettings) {
      const connectionId = this.#settings.connect(`changed::${setting}`, () => {
        this.applyToAllTargets();
      });
      this.#signalConnections.push(connectionId);
    }
  }

  /**
   * Get the current style configuration from settings
   */
  #getCurrentStyleConfig(): StyleConfig {
    const dividerPreset = this.#settings.get_enum(SettingsKey.DIVIDER_PRESET);
    const customDividerText = this.#settings.get_string(
      SettingsKey.CUSTOM_DIVIDER_TEXT,
    );
    const colorMode = this.#settings.get_enum(SettingsKey.COLOR_MODE);

    let clockColor: Color;
    let dateColor: Color;
    let dividerColor: Color;

    if (colorMode === 1) {
      // Accent color mode
      const accentColor = this.getAccentColor();
      clockColor = accentColor;
      dateColor = accentColor;
      dividerColor = accentColor;
    } else if (colorMode === 2) {
      // Custom colors mode
      clockColor = new Color(
        this.#settings.get_string(SettingsKey.CLOCK_COLOR),
      );
      dateColor = new Color(this.#settings.get_string(SettingsKey.DATE_COLOR));
      dividerColor = new Color(
        this.#settings.get_string(SettingsKey.DIVIDER_COLOR),
      );
    } else {
      // Default mode (0)
      clockColor = new Color("#FFFFFF");
      dateColor = new Color("#FFFFFF");
      dividerColor = new Color("#FFFFFF");
    }

    return {
      clockColor,
      dateColor,
      dividerColor,
      dividerText: getDividerText(dividerPreset, customDividerText),
    };
  }

  /**
   * Apply current styles to a specific target
   */
  #applyCurrentStyles(target: StyleTarget): void {
    this.applyStyles(target);
  }
}
