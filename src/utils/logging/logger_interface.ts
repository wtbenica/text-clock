/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Logger interface for dependency injection across different environments.
 */
export interface Logger {
  log(...args: unknown[]): void;
  logError(error: Error, message?: string): void;
}
