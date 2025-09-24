/*
 * Simple dependency injection container for core services
 */

import { SettingsManager } from "./settings_manager.js";
import { StyleService } from "./style_service.js";
import { NotificationService } from "./notification_service.js";

export class ServiceContainer {
  #settings: any;
  settingsManager: SettingsManager;
  styleService: StyleService;
  notificationService: NotificationService;

  constructor(settings: any) {
    this.#settings = settings;
    this.settingsManager = new SettingsManager(this.#settings);
    this.styleService = new StyleService(this.#settings);
    this.notificationService = new NotificationService("Text Clock");
  }

  destroy(): void {
    try {
      if (this.styleService) this.styleService.destroy();
    } catch {
      // best-effort cleanup
    }

    try {
      if (this.settingsManager) this.settingsManager.destroy();
    } catch {
      // best-effort cleanup
    }

    try {
      if (this.notificationService) this.notificationService.destroy();
    } catch {
      // best-effort cleanup
    }
  }
}

export default ServiceContainer;
