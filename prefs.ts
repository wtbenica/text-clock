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

import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {
  ExtensionPreferences,
  gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { SETTINGS } from './prefs_constants.js';
import { PrefItems, Errors } from './constants/constants.js';

// Represents a binding between a setting and a property of a widget.
// This is used to dynamically update the widget's property based on the value of the setting.
//
// It is currenty only used in the `addSwitchRow` method.
//
// @property settingKey The key of the setting in the settings schema.
// @property property The name of the property in the widget to bind the setting to.
type SettingBinding = {
  settingKey: string;
  property: string;
};

/**
 * Preferences Window for the Text Clock extension
 */
export default class TextClockPrefs extends ExtensionPreferences {
  _settings?: Gio.Settings;

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    this._settings = this.getSettings();

    const page = this.#createAndAddPageToWindow(window);

    const group = this.#createAndAddGroupToPage(page);

    this.#addShowDateSwitchRow(group);

    this.#addShowWeekdaySwitchRow(group);

    this.#addTimeFormatComboRow(group);

    this.#createFuzzinessComboRow(group);
  }

  // Create a page and add it to the window
  //
  // @param window The window to add the page to
  // @returns The page
  #createAndAddPageToWindow(window: Adw.PreferencesWindow) {
    const page = new Adw.PreferencesPage({
      title: _('Text Clock'),
    });
    window.add(page);
    return page;
  }

  // Create a group and add it to the page
  //
  // @param page The page to add the group to
  // @returns The group
  #createAndAddGroupToPage(page: Adw.PreferencesPage) {
    const group = new Adw.PreferencesGroup({
      title: _('Clock Settings'),
      description: _('Customize the appearance and behavior of the clock'),
    });
    page.add(group);
    return group;
  }

  // Add a combo row to a preferences group
  //
  // @param group The preferences group to add the row to
  // @param settingKey The key in the settings schema to bind the combo to
  // @param props The properties of the combo row
  // @returns The combo row
  #addComboRow(
    group: Adw.PreferencesGroup,
    settingKey: string,
    props: Partial<Adw.ComboRow.ConstructorProps>
  ): Adw.ComboRow {
    const row = new Adw.ComboRow(props);
    group.add(row);
    try {
      row.connect('notify::selected', (widget: Adw.ComboRow) => {
        this._settings!.set_enum(settingKey, widget.selected);
      });
    } catch (error) {
      console.error(`Error binding settings for ${props.title}:`, error);
    }
    return row;
  }

  // Add a switch row to a preferences group
  //
  // @param group The preferences group to add the row to
  // @param props The properties of the switch row
  // @param settingKey The key in the settings schema to bind the switch to
  // @param settingBindings The settings to bind to the switch
  // @returns The switch row
  #addSwitchRow(
    group: Adw.PreferencesGroup,
    props: Partial<Adw.SwitchRow.ConstructorProps>,
    settingKey: string,
    settingBindings?: SettingBinding[]
  ): Adw.SwitchRow {
    const row = new Adw.SwitchRow(props);
    group.add(row);

    this.#bindSettingsToProperty(row, settingKey, 'active');

    settingBindings?.forEach((binding) => {
      this.#bindSettingsToProperty(row, binding.settingKey, binding.property);
    });
    return row;
  }

  // Bind a setting to a property of a widget
  //
  // @param widget The widget to bind the setting to
  // @param settingKey The key in the settings schema to bind
  // @param property The property of the widget to bind the setting to
  #bindSettingsToProperty(
    widget: Adw.ActionRow,
    settingKey: string,
    property: string
  ) {
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

  // Create a combo row for the fuzziness setting and add it to the group
  //
  // @param group The preferences group to add the row to
  #createFuzzinessComboRow(group: Adw.PreferencesGroup) {
    const fuzzinessComboInfo = {
      title: _(PrefItems.FUZZINESS.title),
      subtitle: _(PrefItems.FUZZINESS.subtitle),
      model: new Gtk.StringList({ strings: ['1', '5', '10', '15'] }),
      selected: this._settings!.get_enum(SETTINGS.FUZZINESS),
    };

    this.#addComboRow(group, SETTINGS.FUZZINESS, fuzzinessComboInfo);
  }

  // Create a combo row for the time format setting and add it to the group
  //
  // @param group The preferences group to add the row to
  #addTimeFormatComboRow(group: Adw.PreferencesGroup) {
    const timeFormatComboInfo = {
      title: _(PrefItems.TIME_FORMAT.title),
      subtitle: _(PrefItems.TIME_FORMAT.subtitle),
      model: new Gtk.StringList({
        strings: [
          _('twenty past %s').format(_('ten')),
          _('%s twenty').format(_('ten')),
        ],
      }),
      selected: this._settings!.get_enum(SETTINGS.TIME_FORMAT),
    };
    this.#addComboRow(group, SETTINGS.TIME_FORMAT, timeFormatComboInfo);
  }

  // Create a switch row for the show weekday setting and add it to the group
  //
  // @param group The preferences group to add the row to
  #addShowWeekdaySwitchRow(group: Adw.PreferencesGroup) {
    const showWeekdaySwitchInfo = {
      title: _(PrefItems.SHOW_WEEKDAY.title),
      subtitle: _(PrefItems.SHOW_WEEKDAY.subtitle),
      sensitive: this._settings!.get_boolean(SETTINGS.SHOW_DATE),
    };
    this.#addSwitchRow(group, showWeekdaySwitchInfo, SETTINGS.SHOW_WEEKDAY, [
      {
        settingKey: SETTINGS.SHOW_DATE,
        property: 'sensitive',
      },
    ]);
  }

  // Create a switch row for the show date setting and add it to the group
  //
  // @param group The preferences group to add the row to
  #addShowDateSwitchRow(group: Adw.PreferencesGroup) {
    const showDateSwitchInfo = {
      title: _(PrefItems.SHOW_DATE.title),
      subtitle: _(PrefItems.SHOW_DATE.subtitle),
    };
    this.#addSwitchRow(group, showDateSwitchInfo, SETTINGS.SHOW_DATE);
  }
}
