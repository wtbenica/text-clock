/*
 * SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { SETTINGS, PrefItems, Errors } from "./constants/index.js";
import { ClockFormatter, TimeFormat, Fuzziness } from "./clock_formatter.js";
import { fuzzinessFromEnumIndex } from "./utils/fuzziness-utils.js";
import { WordPack } from "./word_pack.js";
import {
  timesFormatOne,
  midnightFormatOne,
  noonFormatOne,
  timesFormatTwo,
  midnightFormatTwo,
  noonFormatTwo,
  hourNames,
  midnight,
  noon,
} from "./constants/times/prefs.js";
import { weekdays, dateOnly, daysOfMonth } from "./constants/dates/prefs.js";
import { logErr } from "./utils/error-utils.js";

/**
 * @returns a word pack that contains the strings for telling the time and date
 */
export const TRANSLATE_PACK: () => WordPack = () =>
  new WordPack({
    timesFormatOne: timesFormatOne(),
    midnightFormatOne: midnightFormatOne(),
    noonFormatOne: noonFormatOne(),
    timesFormatTwo: timesFormatTwo(),
    midnightFormatTwo: midnightFormatTwo(),
    noonFormatTwo: noonFormatTwo(),
    names: hourNames(),
    days: weekdays(),
    dayOnly: dateOnly(),
    midnight: midnight(),
    noon: noon(),
    daysOfMonth: daysOfMonth(),
  });

/**
 * Represents a binding between a setting and a property of a widget.
 * This is used to dynamically update the widget's property based on the value of the setting.
 *
 * It is currenty only used in the `addSwitchRow` method.
 *
 * @property settingKey The key of the setting in the settings schema.
 * @property property The name of the property in the widget to bind the setting to.
 */
type SettingBinding = {
  settingKey: string;
  property: string;
};

/**
 * Preferences Window for the Text Clock extension
 */
export default class TextClockPrefs extends ExtensionPreferences {
  async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    const settings = this.getSettings();

    const page = this.#createAndAddPageToWindow(window);

    const clockSettingsGroup = this.#createAndAddGroupToPage(
      page,
      "Clock Settings",
      "Customize the appearance and behavior of the clock",
    );

    this.#addShowDateSwitchRow(clockSettingsGroup, settings);

    this.#addShowWeekdaySwitchRow(clockSettingsGroup, settings);

    this.#addTimeFormatComboRow(clockSettingsGroup, settings);

    this.#createFuzzinessComboRow(clockSettingsGroup, settings);

    this.#addDividerTextRow(clockSettingsGroup, settings);

    const clockColorSettingsGroup = this.#createAndAddGroupToPage(
      page,
      "Clock Colors",
      "Customize the colors of the clock and date text",
    );

    this.#addClockColorRow(clockColorSettingsGroup, settings);

    this.#addDateColorRow(clockColorSettingsGroup, settings);

    this.#addDividerColorRow(clockColorSettingsGroup, settings);

    return Promise.resolve();
  }

  /**
   * Create a page and add it to the window
   *
   * @param window The window to add the page to
   *
   * @returns The page
   */
  #createAndAddPageToWindow(window: Adw.PreferencesWindow) {
    const page = new Adw.PreferencesPage({
      title: _("Text Clock"),
    });
    window.add(page);
    return page;
  }

  /**
   * Create and add the clock
   */

  /**
   * Create a group and add it to the page
   *
   * @param page The page to add the group to
   *
   * @returns The group
   */
  #createAndAddGroupToPage(
    page: Adw.PreferencesPage,
    title_tag: string,
    description_tag: string,
  ) {
    const group = new Adw.PreferencesGroup({
      title: _(title_tag),
      description: _(description_tag),
    });
    page.add(group);
    return group;
  }

  /**
   * Add a combo row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param settingKey The key in the settings schema to bind the combo to
   * @param props The properties of the combo row
   *
   * @returns The combo row
   */
  #addComboRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
    settingKey: string,
    props: Partial<Adw.ComboRow.ConstructorProps>,
  ): Adw.ComboRow {
    const row = new Adw.ComboRow(props);
    group.add(row);
    try {
      row.connect("notify::selected", (widget: Adw.ComboRow) => {
        settings!.set_enum(settingKey, widget.selected);
      });
    } catch (error: any) {
      logErr(error, `Error binding settings for ${props.title}:`);
    }
    return row;
  }

  /**
   * Add a switch row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param props The properties of the switch row
   * @param settingKey The key in the settings schema to bind the switch to
   * @param settingBindings The settings to bind to the switch
   *
   * @returns The switch row
   */
  #addSwitchRow(
    group: Adw.PreferencesGroup,
    props: Partial<Adw.SwitchRow.ConstructorProps>,
    settings: Gio.Settings,
    settingKey: string,
    settingBindings?: SettingBinding[],
  ): Adw.SwitchRow {
    const row = new Adw.SwitchRow(props);
    group.add(row);

    this.#bindSettingsToProperty(row, settings, settingKey, "active");

    settingBindings?.forEach((binding) => {
      this.#bindSettingsToProperty(
        row,
        settings,
        binding.settingKey,
        binding.property,
      );
    });
    return row;
  }

  /**
   * Bind a setting to a property of a widget
   *
   * @param widget The widget to bind the setting to
   * @param settingKey The key in the settings schema to bind
   * @param property The property of the widget to bind the setting to
   */
  #bindSettingsToProperty(
    widget: Adw.ActionRow,
    settings: Gio.Settings,
    settingKey: string,
    property: string,
  ) {
    try {
      settings!.bind(
        settingKey,
        widget,
        property,
        Gio.SettingsBindFlags.DEFAULT,
      );
    } catch (error: any) {
      logErr(error, `${_(Errors.ERROR_BINDING_SETTINGS_FOR_)} ${widget.title}`);
    }
  }

  /**
   * Create a combo row for the fuzziness setting and add it to the group
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The combo row
   */
  #createFuzzinessComboRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ComboRow {
    const fuzzinessComboInfo = {
      title: _(PrefItems.FUZZINESS.title),
      subtitle: _(PrefItems.FUZZINESS.subtitle),
      model: new Gtk.StringList({ strings: ["1", "5", "10", "15"] }),
      selected: settings!.get_enum(SETTINGS.FUZZINESS),
    };

    return this.#addComboRow(
      group,
      settings,
      SETTINGS.FUZZINESS,
      fuzzinessComboInfo,
    );
  }

  /**
   * Create a combo row for the time format setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The combo row
   */
  #addTimeFormatComboRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ComboRow {
    const timeFormatComboInfo = {
      title: _(PrefItems.TIME_FORMAT.title),
      subtitle: _(PrefItems.TIME_FORMAT.subtitle),
      model: this.#getTimeFormatsList(settings),
      selected: settings!.get_enum(SETTINGS.TIME_FORMAT),
    };

    return this.#addComboRow(
      group,
      settings,
      SETTINGS.TIME_FORMAT,
      timeFormatComboInfo,
    );
  }

  /**
   * Get a list of the localized time format string templates
   *
   * @param settings The settings schema
   *
   * @returns A list of the localized time format string templates
   */
  #getTimeFormatsList(settings: Gio.Settings): Gtk.StringList {
    const clockFormatter = new ClockFormatter(TRANSLATE_PACK());

    const date = new Date();
    const fuzzinessEnumIndex = settings.get_enum(SETTINGS.FUZZINESS);
    const fuzziness = fuzzinessFromEnumIndex(fuzzinessEnumIndex);

    const timeFormatOne = clockFormatter.getClockText(
      date,
      false,
      false,
      TimeFormat.FORMAT_ONE,
      fuzziness,
    );

    const timeFormatTwo = clockFormatter.getClockText(
      date,
      false,
      false,
      TimeFormat.FORMAT_TWO,
      fuzziness,
    );

    return new Gtk.StringList({
      strings: [timeFormatOne, timeFormatTwo],
    });
  }

  /**
   * Create a switch row for the show weekday setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The switch row
   */
  #addShowWeekdaySwitchRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.SwitchRow {
    const showWeekdaySwitchInfo = {
      title: _(PrefItems.SHOW_WEEKDAY.title),
      subtitle: _(PrefItems.SHOW_WEEKDAY.subtitle),
      sensitive: settings!.get_boolean(SETTINGS.SHOW_DATE),
    };
    return this.#addSwitchRow(
      group,
      showWeekdaySwitchInfo,
      settings,
      SETTINGS.SHOW_WEEKDAY,
      [
        {
          settingKey: SETTINGS.SHOW_DATE,
          property: "sensitive",
        },
      ],
    );
  }

  /**
   * Create a switch row for the show date setting and add it to the group
   *
   * @param group The preferences group to add the row to
   * @param settings The settings schema
   *
   * @returns The switch row
   */
  #addShowDateSwitchRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.SwitchRow {
    const showDateSwitchInfo = {
      title: _(PrefItems.SHOW_DATE.title),
      subtitle: _(PrefItems.SHOW_DATE.subtitle),
    };
    return this.#addSwitchRow(
      group,
      showDateSwitchInfo,
      settings,
      SETTINGS.SHOW_DATE,
    );
  }

  /**
   * Add a color row for clock color
   */
  #addClockColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ActionRow {
    const row = new Adw.ActionRow({
      title: _("Clock Color"),
      subtitle: _("Color for the time text"),
    });
    const colorButton = new Gtk.ColorButton();
    // Set initial color
    const rgba = new Gdk.RGBA();
    rgba.parse(settings.get_string("clock-color"));
    colorButton.set_rgba(rgba);
    // Connect to changes
    colorButton.connect("color-set", () => {
      const newRgba = colorButton.get_rgba();
      settings.set_string("clock-color", newRgba.to_string());
    });
    row.add_suffix(colorButton);
    group.add(row);
    return row;
  }

  /**
   * Add a color row for date color
   */
  #addDateColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ActionRow {
    const row = new Adw.ActionRow({
      title: _("Date Color"),
      subtitle: _("Color for the date text"),
    });
    const colorButton = new Gtk.ColorButton();
    const rgba = new Gdk.RGBA();
    rgba.parse(settings.get_string("date-color"));
    colorButton.set_rgba(rgba);
    colorButton.connect("color-set", () => {
      const newRgba = colorButton.get_rgba();
      settings.set_string("date-color", newRgba.to_string());
    });
    row.add_suffix(colorButton);
    group.add(row);
    return row;
  }

  /**
   * Add a color row for divider color
   */
  #addDividerColorRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.ActionRow {
    const row = new Adw.ActionRow({
      title: _("Divider Color"),
      subtitle: _("Color for the divider text"),
    });
    const colorButton = new Gtk.ColorButton();
    const rgba = new Gdk.RGBA();
    rgba.parse(settings.get_string("divider-color"));
    colorButton.set_rgba(rgba);
    colorButton.connect("color-set", () => {
      const newRgba = colorButton.get_rgba();
      settings.set_string("divider-color", newRgba.to_string());
    });
    row.add_suffix(colorButton);
    group.add(row);
    return row;
  }

  /**
   * Add an entry row for divider text
   */
  #addDividerTextRow(
    group: Adw.PreferencesGroup,
    settings: Gio.Settings,
  ): Adw.EntryRow {
    const row = new Adw.EntryRow({
      title: _("Divider Text"),
      text: settings.get_string("divider-text"),
    });
    group.add(row);
    settings.bind("divider-text", row, "text", Gio.SettingsBindFlags.DEFAULT);
    return row;
  }
}
