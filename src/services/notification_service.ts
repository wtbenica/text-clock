/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GLib from "gi://GLib";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";

import { logErr, logWarn } from "../utils/error_utils.js";
import { extensionGettext } from "../utils/gettext/gettext_utils_ext.js";

/**
 * Configuration object for creating and displaying notifications.
 *
 * Defines all the properties needed to create a notification, including
 * basic content, appearance, and interactive actions.
 */
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

/**
 * Interactive action that can be added to a notification.
 *
 * Allows users to perform specific actions directly from the notification,
 * such as opening preferences or dismissing update notices.
 */
export interface NotificationAction {
  /** Text label shown on the action button */
  label: string;

  /** Function called when the user clicks the action button */
  callback: () => void;
}

/**
 * Service responsible for managing extension notifications in GNOME Shell.
 *
 * Provides a comprehensive interface for creating, displaying, and managing
 * notifications within the GNOME Shell environment. Handles the complexities
 * of GNOME's notification system including message sources, persistence,
 * actions, and proper cleanup.
 *
 * Key features:
 * - Simple text notifications for basic messages
 * - Rich notifications with actions and persistence
 * - Delayed notification scheduling for timing-sensitive messages
 * - Automatic message source management
 * - Graceful fallbacks when notification system is unavailable
 * - Proper resource cleanup to prevent memory leaks
 *
 * @example
 * ```typescript
 * const notificationService = new NotificationService('Text Clock');
 *
 * // Simple notification
 * notificationService.showSimpleNotification(
 *   'Settings Changed',
 *   'Clock colors have been updated'
 * );
 *
 * // Rich notification with action
 * notificationService.showNotification({
 *   title: 'Extension Updated',
 *   body: 'New features are available',
 *   isResident: true,
 *   actions: [{
 *     label: 'Open Preferences',
 *     callback: () => openPreferences()
 *   }]
 * });
 *
 * // Cleanup
 * notificationService.destroy();
 * ```
 */
export class NotificationService {
  private static readonly DEFAULT_ICON =
    "preferences-desktop-notification-symbolic";
  private static readonly UPDATE_DELAY_SECONDS = 4;

  private extensionName: string;
  private notificationSource?: MessageTray.Source;

  /**
   * Create a new notification service for the specified extension.
   *
   * @param extensionName - Name of the extension (shown as notification source)
   */
  constructor(extensionName: string) {
    this.extensionName = extensionName;
  }

  /**
   * Shows a simple notification with title and body text.
   *
   * Convenience method for displaying basic notifications without additional
   * configuration. Uses default icon and behavior settings.
   *
   * @param title - The notification title shown prominently
   * @param body - The notification body text with detailed information
   *
   * @example
   * ```typescript
   * notificationService.showSimpleNotification(
   *   'Settings Saved',
   *   'Your preferences have been updated successfully'
   * );
   * ```
   */
  showSimpleNotification(title: string, body: string): void {
    this.showNotification({
      title,
      body,
    });
  }

  /**
   * Shows a notification for extension updates with interactive preferences access.
   *
   * Displays a delayed, persistent notification informing users about extension
   * updates and providing direct access to preferences. The notification includes
   * version information and an action button for opening preferences.
   *
   * @param title - Custom notification title
   * @param body - Custom notification body message
   * @param onOpenPreferences - Callback function to open the extension preferences
   *
   * @example
   * ```typescript
   * // Using release message utilities:
   * import { getUpdateNotificationTitle, generateUpdateMessage } from '../constants/release_messages.js';
   *
   * const title = getUpdateNotificationTitle('1.0.6', extensionGettext);
   * const body = generateUpdateMessage('1.0.6', extensionGettext);
   * notificationService.showUpdateNotification(title, body, () => extension.openPreferences());
   * ```
   */
  showUpdateNotification(
    title: string,
    body: string,
    onOpenPreferences: () => void,
  ): void {
    const { _ } = extensionGettext;

    const config: NotificationConfig = {
      title,
      body,
      isResident: true,
      actions: [
        {
          label: _("Open Preferences"),
          callback: () => {
            try {
              onOpenPreferences();
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
   * Shows a notification with full configuration options.
   *
   * Creates and displays a notification using the complete configuration
   * object, allowing for custom icons, persistence, actions, and other
   * advanced features. Includes error handling with fallback mechanisms.
   *
   * @param config - Complete notification configuration object
   *
   * @example
   * ```typescript
   * notificationService.showNotification({
   *   title: 'Configuration Error',
   *   body: 'Invalid color format detected',
   *   iconName: 'dialog-warning-symbolic',
   *   isResident: true,
   *   actions: [
   *     {
   *       label: 'Reset to Default',
   *       callback: () => resetColorSettings()
   *     },
   *     {
   *       label: 'Open Help',
   *       callback: () => showHelp()
   *     }
   *   ]
   * });
   * ```
   */
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
      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, delaySeconds, () => {
          this.showNotification(config);
          return GLib.SOURCE_REMOVE;
        });
        return GLib.SOURCE_REMOVE;
      });
    } catch (error) {
      logWarn(`Failed to schedule notification: ${String(error)}`);
    }
  }

  /**
   * Cleans up notification resources and prevents memory leaks.
   *
   * Clears internal references to notification sources. The GNOME Shell
   * message tray automatically handles cleanup of actual notification
   * sources, so this method primarily clears internal state.
   *
   * Should be called when the extension is disabled or the service is
   * no longer needed.
   *
   * @example
   * ```typescript
   * class TextClockExtension extends Extension {
   *   disable() {
   *     this.notificationService.destroy();
   *   }
   * }
   * ```
   */
  destroy(): void {
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
