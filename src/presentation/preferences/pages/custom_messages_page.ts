// SPDX-License-Identifier: GPL-3.0-or-later

import { CustomMessage } from "../../../models/custom_message.js";

/**
 * UI for managing custom day messages.
 */
export class CustomMessagesPage {
  private messages: CustomMessage[] = [];

  constructor() {
    // Initialize with empty messages or load from storage.
    this.messages = this.loadMessages();
  }

  /** Render the UI for managing messages. */
  render(): void {
    console.log("Rendering Custom Messages Page...");
    // TODO: Implement UI rendering logic.
  }

  /** Add a new custom message. */
  addMessage(message: CustomMessage): void {
    this.messages.push(message);
    this.saveMessages();
  }

  /** Edit an existing custom message. */
  editMessage(index: number, updatedMessage: CustomMessage): void {
    this.messages[index] = updatedMessage;
    this.saveMessages();
  }

  /** Delete a custom message. */
  deleteMessage(index: number): void {
    this.messages.splice(index, 1);
    this.saveMessages();
  }

  /** Load messages from storage. */
  private loadMessages(): CustomMessage[] {
    // TODO: Implement loading logic (e.g., from localStorage or preferences).
    return [];
  }

  /** Save messages to storage. */
  private saveMessages(): void {
    // TODO: Implement saving logic (e.g., to localStorage or preferences).
  }
}
