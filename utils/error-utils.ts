/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Centralized error handling utilities for the Text Clock extension
 */

// Conditionally import gettext - use a fallback for test environment
let _: (msgid: string) => string;
try {
  // This will work in the GNOME Shell environment
  ({ gettext: _ } = imports.gettext);
} catch {
  // Fallback for test environment or when GNOME Shell imports aren't available
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ = (msgid: string) => msgid;
}

/**
 * Logs an error with consistent formatting and optional context
 *
 * @param message - The error object or message to log
 * @param context - Optional context message for better debugging
 * @param level - Log level ('error', 'warn', 'info', 'debug')
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
        logError(message, fullMessage); // Preserve original error details
      } else {
        logError(new Error(String(message)), fullMessage); // Wrap string in Error
      }
      break;
    case "warn":
      log(`[WARN] ${fullMessage}`);
      break;
    case "info":
      log(`[INFO] ${fullMessage}`);
      break;
    case "debug":
      log(`[DEBUG] ${fullMessage}`);
      break;
  }
}

// Convenience wrappers
export function logErr(error: Error | string | unknown, context?: string) {
  return logMessage(error, context, "error");
}

export function logWarn(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "warn");
}

export function logInfo(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "info");
}

export function logDebug(message: Error | string | unknown, context?: string) {
  return logMessage(message, context, "debug");
}

/**
 * Safely executes a function and handles any errors that occur
 *
 * @param fn - The function to execute
 * @param errorContext - Context message for error logging
 * @param fallbackValue - Value to return if function fails
 * @returns The result of the function or the fallback value
 */
export function safeExecute<T>(
  fn: () => T,
  errorContext: string,
  fallbackValue?: T,
): T | undefined {
  try {
    return fn();
  } catch (error) {
    logMessage(error, errorContext);
    return fallbackValue;
  }
}

/**
 * Validates that a required value is not null or undefined
 *
 * @param value - The value to check
 * @param valueName - Name of the value for error messages
 * @throws Error if the value is null or undefined
 */
export function validateRequired<T>(
  value: T | null | undefined,
  valueName: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Required value '${valueName}' is null or undefined`);
  }
}

/**
 * Validates that a date object is valid
 *
 * @param date - The date to validate
 * @param context - Context for error messages
 * @throws Error if the date is invalid
 */
export function validateDate(
  date: Date,
  context: string = "Date validation",
): void {
  if (!date || isNaN(date.getTime())) {
    throw new Error(`${context}: Invalid date provided`);
  }
}

/**
 * Wraps a function that might throw with standardized error handling
 *
 * @param operation - Description of the operation being performed
 * @param fn - The function to wrap
 * @returns A function that executes fn with error handling
 */
export function withErrorHandling<T extends any[], R>(
  operation: string,
  fn: (...args: T) => R,
): (...args: T) => R | undefined {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      logMessage(error, `Failed during ${operation}`);
      return undefined;
    }
  };
}
