/*
 * SPDX-FileCopyrightText: 2025 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Mock the dependent services before importing the container so
// the constructor calls are intercepted by Jest.
jest.mock("../../../services/settings_manager", () => ({
  SettingsManager: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    getBoolean: jest.fn().mockReturnValue(true),
    getString: jest.fn().mockReturnValue("fmt"),
    getFuzziness: jest.fn().mockReturnValue(5),
    bindProperty: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

jest.mock("../../../services/style_service", () => ({
  StyleService: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    getCurrentStyles: jest.fn().mockReturnValue({ dividerText: " - " }),
    registerTarget: jest.fn(),
    applyStyles: jest.fn(),
  })),
}));

jest.mock("../../../services/notification_service", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    showUpdateNotification: jest.fn(),
  })),
}));

import ServiceContainer from "../../../services/service_container.js";

describe("ServiceContainer", () => {
  it("constructs services with the provided settings and destroys them", () => {
    const fakeSettings = { fake: true } as any;

    // Import mocks for assertions
    const SettingsManagerMock = require("../../../services/settings_manager")
      .SettingsManager as jest.Mock;
    const StyleServiceMock = require("../../../services/style_service")
      .StyleService as jest.Mock;
    const NotificationMock = require("../../../services/notification_service")
      .NotificationService as jest.Mock;

    const container = new ServiceContainer(fakeSettings);

    // Constructors were called with the settings
    expect(SettingsManagerMock).toHaveBeenCalledWith(fakeSettings);
    expect(StyleServiceMock).toHaveBeenCalledWith(fakeSettings);
    expect(NotificationMock).toHaveBeenCalledWith("Text Clock");

    // Instances are exposed
    expect(container.settingsManager).toBeDefined();
    expect(container.styleService).toBeDefined();
    expect(container.notificationService).toBeDefined();

    // Calling destroy should call each service's destroy method
    container.destroy();

    expect((container.settingsManager as any).destroy).toHaveBeenCalled();
    expect((container.styleService as any).destroy).toHaveBeenCalled();
    expect((container.notificationService as any).destroy).toHaveBeenCalled();
  });
});
