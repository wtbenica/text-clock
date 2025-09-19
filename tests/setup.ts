// SPDX-FileCopyrightText: 2025 2024 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/*
 * Test setup file for Jest
 * This file runs before all tests and sets up the testing environment
 */

// Add String.prototype.format to match GNOME Shell environment
declare global {
  interface String {
    format(...args: any[]): string;
  }
}

// Mock String.prototype.format method
String.prototype.format = function (...args: any[]): string {
  let result = this as string;
  for (let i = 0; i < args.length; i++) {
    result = result.replace("%s", args[i]);
  }
  return result;
};

// Global test setup - cast to any to avoid TypeScript issues in test setup
(global as any).logError = jest.fn();
(global as any)._ = (text: string) => text; // Mock gettext function

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Export something to make this a module
export {};
