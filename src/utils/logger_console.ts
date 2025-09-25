/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Console/Node.js logger implementation for tests
 */
import type { Logger } from "./logger_interface.js";

export const consoleLogger: Logger = {
  log(...args: unknown[]): void {
    console.log(...args);
  },
  logError(error: Error, message?: string): void {
    console.error(message || error.message, error);
  },
};
