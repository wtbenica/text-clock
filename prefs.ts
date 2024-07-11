/*
 * Copyright (c) 2024 Wesley Benica
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { SETTINGS } from "./prefs_constants.js";
import { PrefItems, Errors } from "./constants_en.js";

export default class TextClockPrefs extends ExtensionPreferences {
  _settings?: Gio.Settings;

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("Text Clock"),
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: _("Clock Settings"),
      description: _("Customize the appearance and behavior of the clock"),
    });
    page.add(group);

    this.addSwitchRow(group, {
      title: _(PrefItems.SHOW_DATE.title),
      subtitle: _(PrefItems.SHOW_DATE.subtitle),
      settingKey: SETTINGS.SHOW_DATE,
    });

    const showWeekdayRow = this.addSwitchRow(group, {
      title: _(PrefItems.SHOW_WEEKDAY.title),
      subtitle: _(PrefItems.SHOW_WEEKDAY.subtitle),
      settingKey: SETTINGS.SHOW_WEEKDAY,
    });

    showWeekdayRow.sensitive = this._settings.get_boolean(SETTINGS.SHOW_DATE);
    this._settings.bind(
      SETTINGS.SHOW_DATE,
      showWeekdayRow,
      "sensitive",
      Gio.SettingsBindFlags.DEFAULT
    );

    this.addComboRow(group, {
      title: _(PrefItems.TIME_FORMAT.title),
      subtitle: _(PrefItems.TIME_FORMAT.subtitle),
      settingKey: SETTINGS.TIME_FORMAT,
      model: new Gtk.StringList({
        strings: [
          _("twenty past %s").format(_("ten")),
          _("%s twenty").format(_("ten")),
        ],
      }),
      selected: this._settings!.get_enum(SETTINGS.TIME_FORMAT),
    });

    this.addComboRow(group, {
      title: _(PrefItems.FUZZINESS.title),
      subtitle: _(PrefItems.FUZZINESS.subtitle),
      settingKey: SETTINGS.FUZZINESS,
      model: new Gtk.StringList({ strings: ["1", "5", "10", "15"] }),
      selected: this._settings!.get_enum(SETTINGS.FUZZINESS),
    });
  }

  /**
   * Add a switch row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param title The title of the switch row
   * @param subtitle The subtitle of the switch row
   * @param settingKey The key in the settings schema to bind the switch to
   * @returns The switch row
   */
  addSwitchRow(
    group: Adw.PreferencesGroup,
    {
      title,
      subtitle,
      settingKey,
    }: { title: string; subtitle: string; settingKey: string }
  ): Adw.SwitchRow {
    const row = new Adw.SwitchRow({ title, subtitle });
    this.addWidgetToGroup(row, settingKey, group, "active");
    return row;
  }

  addWidgetToGroup(
    widget: Adw.ActionRow,
    settingKey: string,
    group: Adw.PreferencesGroup,
    property: string
  ) {
    group.add(widget);
    try {
      this._settings!.bind(
        settingKey,
        widget,
        property,
        Gio.SettingsBindFlags.DEFAULT
      );
    } catch (error: any) {
      logError(
        error,
        `${_(Errors.ERROR_BINDING_SETTINGS_FOR_)} ${widget.title}`
      );
    }
  }

  /**
   * Add a combo row to a preferences group
   *
   * @param group The preferences group to add the row to
   * @param title The title of the combo row
   * @param subtitle The subtitle of the combo row
   * @param settingKey The key in the settings schema to bind the combo to
   * @param model The strings for the combo row
   * @param selected The index of the selected option
   * @returns The combo row
   */
  addComboRow(
    group: Adw.PreferencesGroup,
    {
      title,
      subtitle,
      settingKey,
      model,
      selected,
    }: {
      title: string;
      subtitle: string;
      settingKey: string;
      model: Gio.ListModel;
      selected: number;
    }
  ): Adw.ComboRow {
    const row = new Adw.ComboRow({
      title,
      subtitle,
      model,
      selected,
    });
    group.add(row);
    try {
      row.connect("notify::selected", (widget) => {
        this._settings!.set_enum(settingKey, widget.selected);
      });
    } catch (error) {
      console.error(`Error binding settings for ${title}:`, error);
    }
    return row;
  }
}
