import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";
import { logErr } from "../../../utils/error_utils.js";

export function createColorControlWidget(
  settings: Gio.Settings,
  styleSvc: any,
  colorSettingsKey: string,
  accentSettingsKey: string,
  errorContext: string,
): Gtk.Widget {
  const control = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    halign: Gtk.Align.CENTER,
  });

  const accentSwitch = new Gtk.Switch();
  accentSwitch.set_valign(Gtk.Align.CENTER);

  const switchLabel = new Gtk.Label({
    label: prefsGettext._("Accent"),
    valign: Gtk.Align.CENTER,
  });

  // Create a stack to switch between real ColorButton and fake one
  const colorStack = new Gtk.Stack();
  colorStack.set_size_request(40, 40);
  colorStack.set_valign(Gtk.Align.CENTER);

  const colorButton = new Gtk.ColorButton();
  colorButton.set_size_request(40, 40);
  colorButton.set_valign(Gtk.Align.CENTER);

  // Create a fake button that looks like ColorButton but doesn't open dialog
  const fakeColorButton = new Gtk.Box();
  fakeColorButton.set_size_request(40, 40);
  fakeColorButton.set_valign(Gtk.Align.CENTER);
  fakeColorButton.set_halign(Gtk.Align.CENTER);
  fakeColorButton.add_css_class("color-button-fake");

  // Make it look clickable but non-functional
  fakeColorButton.set_can_focus(true);
  fakeColorButton.set_can_target(true);

  // Add both to stack
  colorStack.add_named(colorButton, "real");
  colorStack.add_named(fakeColorButton, "fake");

  const updateColorPicker = () => {
    const useAccent = accentSwitch.get_active();

    if (useAccent) {
      try {
        const accentColor = styleSvc.getAccentColor().toString();
        const rgba = new Gdk.RGBA();
        rgba.parse(accentColor);

        // Update both buttons with the color
        colorButton.set_rgba(rgba);

        // Set fake button background to match
        const cssProvider = new Gtk.CssProvider();
        const css = `
          .color-button-fake {
            background-color: ${accentColor};
            border-radius: 5px;
            min-width: 26px;
            min-height: 32px;
            padding: 0px;
            margin: 8px 0px;
            box-shadow: inset 0 1px rgba(255,255,255,0.1);
          }
          .color-button-fake:hover {
            border-color: mix(${accentColor}, black, 0.7);
            box-shadow: inset 0 1px rgba(255,255,255,0.2);
          }
          .color-button-fake:focus {
            outline: 2px solid alpha(${accentColor}, 0.5);
            outline-offset: 2px;
          }
        `;
        cssProvider.load_from_data(css, css.length);
        fakeColorButton
          .get_style_context()
          .add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        // Switch to fake button
        colorStack.set_visible_child_name("fake");
      } catch (e) {
        logErr(e, "Error setting accent color");
      }
    } else {
      try {
        const customColor = settings.get_string(colorSettingsKey);
        const rgba = new Gdk.RGBA();
        rgba.parse(customColor);
        colorButton.set_rgba(rgba);

        // Switch to real button
        colorStack.set_visible_child_name("real");
      } catch (e) {
        logErr(e, "Error setting custom color");
      }
    }
  };

  /**
   * Update accent color display when window receives focus.
   * Only updates if accent mode is active to avoid unnecessary work.
   */
  const updateOnWindowFocus = () => {
    if (accentSwitch.get_active()) {
      updateColorPicker();
    }
  };

  // Connect to window focus events for accent color updates
  const setupWindowFocusListener = () => {
    const prefsWindow = control.get_root() as Adw.PreferencesWindow | null;
    if (prefsWindow) {
      prefsWindow.connect("notify::is-active", () => {
        if (prefsWindow.is_active) {
          updateOnWindowFocus();
        }
      });
    }
  };

  // Try to set up window focus listener immediately, or defer until window is available
  if (control.get_root()) {
    setupWindowFocusListener();
  } else {
    // Wait until control is added to window hierarchy
    const notifyHandler = control.connect("notify::root", () => {
      if (control.get_root()) {
        setupWindowFocusListener();
        control.disconnect(notifyHandler);
      }
    });
  }

  try {
    settings.bind(
      accentSettingsKey,
      accentSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
  } catch (e) {
    logErr(e, `Error binding ${errorContext}`);
  }

  // Update colors when accent switch is toggled
  accentSwitch.connect("state-set", () => {
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      updateColorPicker();
      return false;
    });
  });

  colorButton.connect("color-set", () => {
    if (!accentSwitch.get_active()) {
      // Only process color changes when not in accent mode (i.e., when real button is visible)
      const newRgba = colorButton.get_rgba();
      settings.set_string(colorSettingsKey, newRgba.to_string());
    }
  });

  // Initial color setup
  updateColorPicker();

  control.append(switchLabel);
  control.append(accentSwitch);
  control.append(colorStack);

  (control as any)._colorButton = colorButton;
  (control as any)._accentSwitch = accentSwitch;
  (control as any)._updateColorPicker = updateColorPicker;

  return control;
}

export function createColorRow(
  group: Adw.PreferencesGroup,
  settings: Gio.Settings,
  styleSvc: any,
  title: string,
  colorKey: string,
  accentKey: string,
  errorContext: string,
): Adw.ActionRow {
  const control = createColorControlWidget(
    settings,
    styleSvc,
    colorKey,
    accentKey,
    errorContext,
  );

  const actionRow: Adw.ActionRow = new Adw.ActionRow({ title });
  actionRow.add_suffix(control);
  group.add(actionRow);

  (actionRow as any)._colorButton = (control as any)._colorButton;
  (actionRow as any)._accentSwitch = (control as any)._accentSwitch;
  (actionRow as any)._updateColorPicker = (control as any)._updateColorPicker;
  return actionRow;
}

export function addClockColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return createColorRow(
    group,
    settings,
    styleSvc,
    prefsGettext._("Time Color"),
    "clock-color",
    "clock-use-accent",
    "clock-use-accent",
  );
}

export function addDateColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return createColorRow(
    group,
    settings,
    styleSvc,
    prefsGettext._("Date Color"),
    "date-color",
    "date-use-accent",
    "date-use-accent",
  );
}

export function addDividerColorRow(
  group: any,
  settings: Gio.Settings,
  styleSvc: any,
) {
  return createColorRow(
    group,
    settings,
    styleSvc,
    prefsGettext._("Divider Color"),
    "divider-color",
    "divider-use-accent",
    "divider-use-accent",
  );
}
