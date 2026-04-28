/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Logger implementation for GJS/GNOME Shell environment.
 */

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

export interface Logger {
  log(...args: unknown[]): void;
  logError(error: Error, message?: string): void;
}
