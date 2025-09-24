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
      if (typeof globalThis.logError === "function") {
        if (message instanceof Error) {
          globalThis.logError(message, fullMessage); // Preserve original error details
        } else {
          globalThis.logError(new Error(String(message)), fullMessage); // Wrap string in Error
        }
      }
      break;
    case "warn":
      if (typeof globalThis.log === "function") {
        globalThis.log(`[WARN] ${fullMessage}`);
      }
      break;
    case "info":
      if (typeof globalThis.log === "function") {
        globalThis.log(`[INFO] ${fullMessage}`);
      }
      break;
    case "debug":
      if (typeof globalThis.log === "function") {
        globalThis.log(`[DEBUG] ${fullMessage}`);
      }
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
