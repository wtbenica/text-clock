/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GLib from "gi://GLib";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";

import { logErr, logWarn } from "../utils/error_utils.js";
import { extensionGettext } from "../utils/gettext/gettext_utils_ext.js";

/** Configuration for creating notifications. */
export interface NotificationConfig {
  /** The notification title shown prominently */
  title: string;

  /** The notification body text with detailed information */
  body: string;

  /** Optional icon name for the notification (uses default if not provided) */
  iconName?: string;

  /** Whether the notification should persist until manually dismissed */
  isResident?: boolean;

  /** Optional array of interactive actions the user can perform */
  actions?: NotificationAction[];
}

/** Interactive action for notification buttons. */
export interface NotificationAction {
  /** Text label shown on the action button */
  label: string;

  /** Function called when the user clicks the action button */
  callback: () => void;
}

/** Handles GNOME Shell notifications with actions and persistence. */
export class NotificationService {
  private static readonly DEFAULT_ICON =
    "preferences-desktop-notification-symbolic";
  private static readonly UPDATE_DELAY_SECONDS = 3;

  private extensionName: string;
  private notificationSource?: MessageTray.Source;
  private activeSourceIds: Set<number> = new Set();

  /** @param extensionName - Shown as notification source name */
  constructor(extensionName: string) {
    this.extensionName = extensionName;
  }

  /** Show a simple notification with title and body. */
  showSimpleNotification(title: string, body: string): void {
    this.showNotification({
      title,
      body,
    });
  }

  /**
   * Show update notification with "Open Preferences" action button.
   * Notification is persistent and delayed by 3 seconds.
   */
  showUpdateNotification(
    title: string,
    body: string,
    onOpenPreferences: () => void,
  ): void {
    const config: NotificationConfig = {
      title,
      body,
      isResident: true,
      actions: [
        {
          label: extensionGettext._("Open Preferences"),
          callback: () => {
            onOpenPreferences();
          },
        },
      ],
    };

    this.scheduleNotification(config, NotificationService.UPDATE_DELAY_SECONDS);
  }

  /** Show notification with full configuration (actions, persistence, etc). */
  showNotification(config: NotificationConfig): void {
    try {
      const source = this.getOrCreateNotificationSource();
      const notification = this.createNotification(config);

      source.addNotification(notification);
    } catch (error) {
      logErr(`Failed to show notification: ${String(error)}`);
      // Fallback to simple Main.notify if available
      this.tryFallbackNotification(config.title, config.body);
    }
  }

  /**
   * Schedules a notification to be shown after a specified delay.
   *
   * Useful for timing-sensitive notifications that should appear after
   * the shell UI is fully ready or when you want to delay notification
   * display for better user experience.
   *
   * @param config - Complete notification configuration object
   * @param delaySeconds - Delay in seconds before showing the notification
   *
   * @example
   * ```typescript
   * // Show update notification 5 seconds after extension loads
   * notificationService.scheduleNotification({
   *   title: 'Extension Loaded',
   *   body: 'Text Clock is ready to use'
   * }, 5);
   * ```
   */
  scheduleNotification(config: NotificationConfig, delaySeconds: number): void {
    try {
      // Wait for shell UI to be ready, then add additional delay
      const idleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        const timeoutId = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          delaySeconds,
          () => {
            this.showNotification(config);
            this.activeSourceIds.delete(timeoutId);
            return GLib.SOURCE_REMOVE;
          },
        );
        this.activeSourceIds.add(timeoutId);
        this.activeSourceIds.delete(idleId);
        return GLib.SOURCE_REMOVE;
      });
      this.activeSourceIds.add(idleId);
    } catch (error) {
      logWarn(`Failed to schedule notification: ${String(error)}`);
    }
  }

  /** Clean up notification resources (message tray auto-cleans actual sources). */
  destroy(): void {
    this.notificationSource = undefined;
    this.clearActiveSources();
  }

  /**
   * Format items as bulleted list for notifications.
   * @param bulletChar - Unicode bullet (default: •)
   */
  formatBulletList(items: string[], bulletChar: string = "•"): string {
    return items.map((item) => `${bulletChar} ${item}`).join("\n");
  }

  /**
   * Format notification body with optional intro text and bullet list.
   * If intro is null, returns only the bullet list.
   */
  formatNotificationWithList(
    intro: string | null,
    items: string[],
    bulletChar: string = "•",
  ): string {
    const bulletList = this.formatBulletList(items, bulletChar);
    return intro ? `${intro}\n${bulletList}` : bulletList;
  }

  // Private Methods

  /** Clear all scheduled notifications (called on destroy). */
  private clearActiveSources(): void {
    this.activeSourceIds.forEach((id) => {
      GLib.source_remove(id);
    });
    this.activeSourceIds.clear();
  }

  /** Get or create notification source for this extension. */
  private getOrCreateNotificationSource(): MessageTray.Source {
    if (!this.notificationSource) {
      this.notificationSource = this.createNotificationSource();
    }
    return this.notificationSource;
  }

  /** Create notification source if needed. */
  private createNotificationSource(): MessageTray.Source {
    // Check if source already exists in the message tray
    const existingSource = Main.messageTray
      .getSources()
      .find(
        (source: MessageTray.Source) => source.title === this.extensionName,
      );

    if (existingSource) {
      return existingSource;
    }

    // Create new source
    const source = new MessageTray.Source({
      title: this.extensionName,
      iconName: NotificationService.DEFAULT_ICON,
    });

    // Add source to message tray
    Main.messageTray.add(source);
    return source;
  }

  /** Create notification object from config. */
  private createNotification(
    config: NotificationConfig,
  ): MessageTray.Notification {
    const notification = new MessageTray.Notification({
      source: this.getOrCreateNotificationSource(),
      title: config.title,
      body: config.body,
      iconName: config.iconName || NotificationService.DEFAULT_ICON,
    });

    if (config.isResident) {
      notification.resident = true;
    }

    // Add actions if provided
    if (config.actions) {
      config.actions.forEach((action) => {
        notification.addAction(action.label, () => {
          action.callback();
          // Auto-dismiss notification after action
          notification.destroy();
        });
      });
    }

    return notification;
  }

  /**
   * Tries to show a fallback notification using Main.notify
   */
  private tryFallbackNotification(title: string, body: string): void {
    try {
      if (Main && typeof Main.notify === "function") {
        Main.notify(title, body);
      }
    } catch (error) {
      logWarn(`Fallback notification failed: ${String(error)}`);
    }
  }
}
