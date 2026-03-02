// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Represents a custom message for specific days.
 */
export interface CustomMessage {
  /** The specific date for one-time messages (ISO format). */
  date?: string;

  /** Recurrence pattern (e.g., 'yearly', 'monthly', or 'none'). */
  recurrence?: "yearly" | "monthly" | "none";

  /** The custom text to display. */
  message: string;
}
