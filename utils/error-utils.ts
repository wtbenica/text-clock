/*
 * Copyright (c) 2024 Wesley Benica
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
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
    _ = (msgid: string) => msgid;
}

/**
 * Logs an error with consistent formatting and optional context
 *
 * @param error - The error object or message to log
 * @param context - Optional context message for better debugging
 * @param level - Log level ('error', 'warn', 'info', 'debug')
 */
export function logExtensionError(
    error: Error | string | unknown,
    context?: string,
    level: 'error' | 'warn' | 'info' | 'debug' = 'error'
): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    switch (level) {
        case 'error':
            logError(new Error(fullMessage), fullMessage);
            break;
        case 'warn':
            console.warn(`[TextClock] ${fullMessage}`);
            break;
        case 'info':
            console.info(`[TextClock] ${fullMessage}`);
            break;
        case 'debug':
            console.debug(`[TextClock] ${fullMessage}`);
            break;
    }
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
    fallbackValue?: T
): T | undefined {
    try {
        return fn();
    } catch (error) {
        logExtensionError(error, errorContext);
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
    valueName: string
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
export function validateDate(date: Date, context: string = 'Date validation'): void {
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
    fn: (...args: T) => R
): (...args: T) => R | undefined {
    return (...args: T): R | undefined => {
        try {
            return fn(...args);
        } catch (error) {
            logExtensionError(error, `Failed during ${operation}`);
            return undefined;
        }
    };
}