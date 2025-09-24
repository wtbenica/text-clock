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
import { normalizeColor } from "../utils/color-utils.js";
import { logInfo, logWarn } from "../utils/error-utils.js";
import { SETTINGS, getDividerText } from "../constants/index.js";
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
    logInfo("StyleService initialized");
  }

  /**
   * Register a target to receive style updates
   */
  registerTarget(target: StyleTarget): void {
    this.#targets.add(target);
    this.#applyCurrentStyles(target);
    logInfo(`Style target registered. Total targets: ${this.#targets.size}`);
  }

  /**
   * Unregister a target from receiving style updates
   */
  unregisterTarget(target: StyleTarget): void {
    const wasRemoved = this.#targets.delete(target);
    if (wasRemoved) {
      logInfo(
        `Style target unregistered. Total targets: ${this.#targets.size}`,
      );
    }
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
    logInfo(`Applied styles to ${this.#targets.size} targets`);
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

    logInfo("StyleService destroyed");
  }

  // Private methods

  /**
   * Connect to settings changes to automatically update styles
   */
  #connectToSettings(): void {
    const colorSettings = [
      SETTINGS.CLOCK_COLOR,
      SETTINGS.DATE_COLOR,
      SETTINGS.DIVIDER_COLOR,
      SETTINGS.DIVIDER_PRESET,
      SETTINGS.CUSTOM_DIVIDER_TEXT,
    ];

    for (const setting of colorSettings) {
      const connectionId = this.#settings.connect(`changed::${setting}`, () => {
        logInfo(`Style setting "${setting}" changed, updating all targets`);
        this.applyToAllTargets();
      });
      this.#signalConnections.push(connectionId);
    }
  }

  /**
   * Get the current style configuration from settings
   */
  #getCurrentStyleConfig(): StyleConfig {
    const dividerPreset = this.#settings.get_enum(SETTINGS.DIVIDER_PRESET);
    const customDividerText = this.#settings.get_string(
      SETTINGS.CUSTOM_DIVIDER_TEXT,
    );

    return {
      clockColor: new Color(this.#settings.get_string(SETTINGS.CLOCK_COLOR)),
      dateColor: new Color(this.#settings.get_string(SETTINGS.DATE_COLOR)),
      dividerColor: new Color(
        this.#settings.get_string(SETTINGS.DIVIDER_COLOR),
      ),
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
