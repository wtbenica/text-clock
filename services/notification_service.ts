/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GLib from "gi://GLib";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import { logInfo, logWarn, logErr } from "../utils/error_utils.js";

/**
 * Configuration for showing notifications
 */
export interface NotificationConfig {
  title: string;
  body: string;
  iconName?: string;
  isResident?: boolean;
  actions?: NotificationAction[];
}

/**
 * Action that can be added to a notification
 */
export interface NotificationAction {
  label: string;
  callback: () => void;
}

/**
 * Service responsible for managing extension notifications
 * Handles creation, display, and lifecycle of notifications
 */
export class NotificationService {
  private static readonly DEFAULT_ICON =
    "preferences-desktop-notification-symbolic";
  private static readonly UPDATE_DELAY_SECONDS = 4;

  private extensionName: string;
  private notificationSource?: MessageTray.Source;

  constructor(extensionName: string) {
    this.extensionName = extensionName;
  }

  /**
   * Shows a simple notification with title and body
   *
   * @param title - The notification title
   * @param body - The notification body text
   */
  showSimpleNotification(title: string, body: string): void {
    this.showNotification({
      title,
      body,
    });
  }

  /**
   * Shows a notification for extension updates with delay
   *
   * @param currentVersion - The current extension version
   * @param onOpenPreferences - Callback to open preferences
   */
  showUpdateNotification(
    currentVersion: string,
    onOpenPreferences: () => void,
  ): void {
    const title = _("Text Clock updated");
    const body = _(
      "Text Clock was updated to version %s. You can now change the clock color and divider text in Preferences.",
    ).replace("%s", currentVersion);

    const config: NotificationConfig = {
      title,
      body,
      isResident: true,
      actions: [
        {
          label: _("Open Preferences"),
          callback: () => {
            try {
              logInfo("Opening preferences from notification action");
              onOpenPreferences();
              // Note: Notification cleanup is handled in the main callback
            } catch (error) {
              logWarn(`Failed to open preferences: ${String(error)}`);
            }
          },
        },
      ],
    };

    this.scheduleNotification(config, NotificationService.UPDATE_DELAY_SECONDS);
  }

  /**
   * Shows a notification with full configuration options
   *
   * @param config - The notification configuration
   */
  showNotification(config: NotificationConfig): void {
    try {
      const source = this.getOrCreateNotificationSource();
      const notification = this.createNotification(config);

      source.addNotification(notification);
      logInfo(`Notification displayed: "${config.title}"`);
    } catch (error) {
      logErr(`Failed to show notification: ${String(error)}`);
      // Fallback to simple Main.notify if available
      this.tryFallbackNotification(config.title, config.body);
    }
  }

  /**
   * Schedules a notification to be shown after a delay
   *
   * @param config - The notification configuration
   * @param delaySeconds - Delay in seconds before showing
   */
  scheduleNotification(config: NotificationConfig, delaySeconds: number): void {
    try {
      // Wait for shell UI to be ready, then add additional delay
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, delaySeconds, () => {
          this.showNotification(config);
          return GLib.SOURCE_REMOVE;
        });
        return GLib.SOURCE_REMOVE;
      });

      logInfo(
        `Notification scheduled for ${delaySeconds} seconds: "${config.title}"`,
      );
    } catch (error) {
      logWarn(`Failed to schedule notification: ${String(error)}`);
    }
  }

  /**
   * Cleans up notification resources
   */
  destroy(): void {
    // Note: MessageTray sources are automatically cleaned up by GNOME Shell
    this.notificationSource = undefined;
  }

  // Private Methods

  /**
   * Gets or creates the notification source for this extension
   */
  private getOrCreateNotificationSource(): MessageTray.Source {
    if (!this.notificationSource) {
      this.notificationSource = this.createNotificationSource();
    }
    return this.notificationSource;
  }

  /**
   * Creates a new notification source
   */
  private createNotificationSource(): MessageTray.Source {
    // Check if source already exists in the message tray
    const existingSource = Main.messageTray
      .getSources()
      .find((source) => source.title === this.extensionName);

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

  /**
   * Creates a notification from the configuration
   */
  private createNotification(
    config: NotificationConfig,
  ): MessageTray.Notification {
    const notification = new MessageTray.Notification({
      source: this.getOrCreateNotificationSource(),
      title: config.title,
      body: config.body,
      iconName: config.iconName || NotificationService.DEFAULT_ICON,
    });

    // Set persistence if requested
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
          logInfo(`Notification dismissed after action: "${action.label}"`);
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
        logInfo("Fallback notification sent successfully");
      }
    } catch (error) {
      logInfo(`Fallback notification also failed: ${String(error)}`);
    }
  }
}
