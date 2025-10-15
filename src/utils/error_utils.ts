/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Centralized error handling utilities for the Text Clock extension.
 *
 * This module provides a unified logging system that works across different
 * environments (GNOME Shell runtime, test environment, preferences UI).
 * It handles logger injection for testing, provides consistent message
 * formatting, and includes validation utilities.
 *
 * The logging functions automatically prefix messages with '[TextClock]'
 * for easy identification in GNOME Shell logs and support different log
 * levels (error, warn, info, debug) with appropriate formatting.
 *
 * @example
 * ```typescript
 * import { logErr, logWarn, logInfo, validateDate } from './error_utils.js';
 *
 * // Simple error logging
 * logErr('Failed to load settings');
 *
 * // Error with context
 * logWarn(error, 'Settings validation');
 *
 * // Different log levels
 * logInfo('Extension initialized');
 *
 * // Validation with automatic error throwing
 * validateDate(new Date('invalid'), 'Clock update');
 * ```
 */

import type { Logger } from "./logging/logger_interface.js";
import { gjsLogger } from "./logging/logger_gjs.js";

// Current logger instance (can be overridden for tests)
let currentLogger: Logger = gjsLogger;

/**
 * Set the logger instance for testing or alternative environments.
 *
 * Allows injection of custom loggers for unit testing or different
 * runtime environments. The default logger works with GNOME Shell's
 * logging system.
 *
 * @param logger - Logger implementation to use for all logging functions
 *
 * @example
 * ```typescript
 * // In tests
 * const mockLogger = { log: jest.fn(), logError: jest.fn() };
 * setLogger(mockLogger);
 *
 * logErr('test error');
 * expect(mockLogger.logError).toHaveBeenCalled();
 * ```
 */
export function setLogger(logger: Logger): void {
  currentLogger = logger;
}

/**
 * Internal function for logging messages with consistent formatting.
 *
 * Handles message formatting, level-specific output, and error object
 * processing. Automatically prefixes all messages with '[TextClock]'
 * for easy identification in logs.
 *
 * @param message - Error object, string, or other value to log
 * @param context - Optional context description for better debugging
 * @param level - Log level determining output format and destination
 *
 * @internal This function is used internally by the public logging functions
 */
function logMessage(
  message: Error | string | unknown,
  context?: string,
  level: "error" | "warn" | "info" | "debug" = "error",
): void {
  const fullMessage = context
    ? `[TextClock] ${context}: ${message instanceof Error ? message.message : String(message)}`
    : `[TextClock] ${message instanceof Error ? message.message : String(message)}`;

  switch (level) {
    case "error":
      if (message instanceof Error) {
        currentLogger.logError(message, fullMessage);
      } else {
        currentLogger.logError(new Error(String(message)), fullMessage);
      }
      break;
    case "warn":
      currentLogger.log(`[WARN] ${fullMessage}`);
      break;
    case "info":
      currentLogger.log(`[INFO] ${fullMessage}`);
      break;
    case "debug":
      currentLogger.log(`[DEBUG] ${fullMessage}`);
      break;
  }
}

/**
 * Log an error message with optional context.
 *
 * For Error objects, logs both the message and stack trace. For other
 * types, converts to string and logs as an error. Includes full error
 * details for debugging.
 *
 * @param error - Error object, string, or other value to log as error
 * @param context - Optional context description for better debugging
 *
 * @example
 * ```typescript
 * try {
 *   parseColorString(invalidColor);
 * } catch (error) {
 *   logErr(error, 'Color parsing');
 * }
 *
 * // Output: [TextClock] Color parsing: Invalid color format '#gggggg'
 * ```
 */
export function logErr(error: Error | string | unknown, context?: string) {
  return logMessage(error, context, "error");
}

/**
 * Log a warning message with optional context.
 *
 * Used for non-critical issues that should be noted but don't prevent
 * operation. Includes '[WARN]' prefix for easy filtering in logs.
 *
 * @param message - Warning message, error object, or other value to log
 * @param context - Optional context description for better debugging
 *
 * @example
 * ```typescript
 * if (colorValue === fallbackColor) {
 *   logWarn(`Using fallback color ${fallbackColor}`, 'Color validation');
 * }
 *
 * // Output: [WARN] [TextClock] Color validation: Using fallback color #FFFFFF
 * ```
 */
export function logWarn(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "warn");
}

/**
 * Log an informational message with optional context.
 *
 * Used for general information that may be useful for debugging or
 * monitoring. Includes '[INFO]' prefix for easy filtering in logs.
 *
 * @param message - Information message, error object, or other value to log
 * @param context - Optional context description for better debugging
 *
 * @example
 * ```typescript
 * logInfo(`Extension version ${version} initialized`, 'Startup');
 * logInfo('Settings successfully loaded');
 *
 * // Output: [INFO] [TextClock] Startup: Extension version 1.2.0 initialized
 * ```
 */
export function logInfo(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "info");
}

/**
 * Log a debug message with optional context.
 *
 * Used for detailed debugging information that's typically only needed
 * during development or troubleshooting. Includes '[DEBUG]' prefix for
 * easy filtering in logs.
 *
 * @param message - Debug message, error object, or other value to log
 * @param context - Optional context description for better debugging
 *
 * @example
 * ```typescript
 * logDebug(`Processing time: ${hours}:${minutes}`, 'Clock formatting');
 * logDebug('Color mode changed to accent', 'Style service');
 *
 * // Output: [DEBUG] [TextClock] Clock formatting: Processing time: 14:30
 * ```
 */
export function logDebug(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "debug");
}

/**
 * Validates that a Date object represents a valid date and time.
 *
 * Checks if the provided Date object is valid (not null, undefined, or
 * representing an invalid date like 'new Date("invalid")'). Throws a
 * descriptive error if validation fails.
 *
 * @param date - The Date object to validate
 * @param context - Context description included in error messages
 * @throws Error if the date is null, undefined, or invalid
 *
 * @example
 * ```typescript
 * function updateClock(date: Date) {
 *   validateDate(date, 'Clock update');
 *   // Safe to use date here
 *   const hours = date.getHours();
 * }
 *
 * // This will throw: "Clock update: Invalid date provided"
 * updateClock(new Date('invalid'));
 * ```
 */
export function validateDate(
  date: Date,
  context: string = "Date validation",
): void {
  if (!date || isNaN(date.getTime())) {
    throw new Error(`${context}: Invalid date provided`);
  }
}
