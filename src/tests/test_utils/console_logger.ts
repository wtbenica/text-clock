/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Logger implementation for Node.js/Jest test environment.
 */

import type { Logger } from "../../utils/logging/logger_interface.js";

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
