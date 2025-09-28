/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Logger } from "./logger_interface.js";

export const consoleLogger: Logger = {
  log(...args: unknown[]): void {
    if (typeof (globalThis as any).console !== "undefined") {
      (globalThis as any).console.log(...args);
    }
  },
  logError(error: Error, message?: string): void {
    if (typeof (globalThis as any).console !== "undefined") {
      (globalThis as any).console.error(message || error.message, error);
    }
  },
};
