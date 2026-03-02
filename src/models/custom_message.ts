// SPDX-License-Identifier: GPL-3.0-or-later

export enum Recurrence {
  None = "none",
  Yearly = "yearly",
  Monthly = "monthly",
}

/**
 * Represents a custom message for specific days.
 */
export class CustomMessage {
  date?: string;
  recurrence: Recurrence = Recurrence.None;
  message: string = "";

  constructor(data: Partial<CustomMessage>) {
    this.date = data.date;
    this.recurrence = data.recurrence ?? Recurrence.None;
    this.message = data.message ?? "";
  }

  update(updatedData: Partial<CustomMessage>): void {
    if (updatedData.date !== undefined) this.date = updatedData.date;
    if (updatedData.recurrence !== undefined) this.recurrence = updatedData.recurrence;
    if (updatedData.message !== undefined) this.message = updatedData.message;
  }

  delete(): void {
    this.date = undefined;
    this.recurrence = Recurrence.None;
    this.message = "";
  }
}
