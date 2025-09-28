/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Logger } from "./logger_interface.js";

export const gjsLogger: Logger = {
  log(...args: unknown[]): void {
    if (typeof (globalThis as any).log === "function") {
      (globalThis as any).log(...args);
    }
  },
  logError(error: Error, message?: string): void {
    if (typeof (globalThis as any).logError === "function") {
      (globalThis as any).logError(error, message);
    }
  },
};
