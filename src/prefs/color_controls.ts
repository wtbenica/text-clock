import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { prefsGettext } from "../utils/gettext/index.js";
import { logErr } from "../utils/error_utils.js";

/**
 * Create a compact color control widget used in prefs.
 *
 * The widget contains an "Accent" switch and a color button. When the accent
 * switch is active the color button mirrors the system accent color, otherwise
 * it represents a custom color stored in settings.
 *
 * @param settings - Gio.Settings instance used to read/write color values
 * @param styleSvc - StyleService instance to read accent color
 * @param colorSettingsKey - GSettings key for the custom color string
 * @param accentSettingsKey - GSettings key for the accent toggle boolean
 * @param errorContext - short string used in error logging context
 * @returns Gtk.Widget - a container widget with the color controls attached
 */
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

  const colorButton = new Gtk.ColorButton();
  colorButton.set_size_request(40, 40);
  colorButton.set_valign(Gtk.Align.CENTER);

  const updateColorPicker = () => {
    const useAccent = accentSwitch.get_active();
    if (useAccent) {
      try {
        const accentColor = styleSvc.getAccentColor().toString();
        const rgba = new Gdk.RGBA();
        rgba.parse(accentColor);
        colorButton.set_rgba(rgba);
      } catch (e) {
        logErr(e, "Error setting accent color");
      }
      colorButton.set_sensitive(true);
    } else {
      try {
        const customColor = settings.get_string(colorSettingsKey);
        const rgba = new Gdk.RGBA();
        rgba.parse(customColor);
        colorButton.set_rgba(rgba);
      } catch (e) {
        logErr(e, "Error setting custom color");
      }
      colorButton.set_sensitive(true);
    }
  };

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

  accentSwitch.connect("state-set", () => {
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      updateColorPicker();
      return false;
    });
  });

  colorButton.connect("color-set", () => {
    if (!accentSwitch.get_active()) {
      const newRgba = colorButton.get_rgba();
      settings.set_string(colorSettingsKey, newRgba.to_string());
    } else {
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        updateColorPicker();
        return false;
      });
    }
  });

  updateColorPicker();

  control.append(switchLabel);
  control.append(accentSwitch);
  control.append(colorButton);

  (control as any)._colorButton = colorButton;
  (control as any)._accentSwitch = accentSwitch;
  (control as any)._updateColorPicker = updateColorPicker;

  return control;
}

/**
 * Create a typed ActionRow with a color control suffix.
 *
 * This constructs an `Adw.ActionRow`, appends the color control (created
 * with `createColorControlWidget`) as a suffix and adds the row to the
 * provided group.
 *
 * @param group - Preferences group to add the row to
 * @param settings - Gio.Settings instance
 * @param styleSvc - StyleService instance
 * @param title - localized title for the row
 * @param colorKey - GSettings key for the custom color
 * @param accentKey - GSettings key for the accent toggle
 * @param errorContext - context string for error logging
 * @returns Adw.ActionRow the created action row
 */
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

  // Construct a typed Adw.ActionRow and attach the control as a suffix.
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
