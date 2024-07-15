/*
 * Copyright (c) 2024 Wesley T Benica
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

/**
 * Holds the title and subtitle for a preference item
 *
 * @param title: { string } The title of the preference item
 * @param subtitle: {string} The subtitle of the preference item
 */
type PrefsText = {
  title: string;
  subtitle: string;
};

/**
 * The title and subtitles for each preference row
 */
export const PrefItems: Record<string, PrefsText> = {
  SHOW_DATE: {
    title: 'Show Date',
    subtitle: 'Show the date in the clock',
  },
  SHOW_WEEKDAY: {
    title: 'Show Weekday',
    subtitle: 'Show the weekday as part of the date',
  },
  TIME_FORMAT: {
    title: 'Time Format',
    subtitle: 'Write the time out in this format',
  },
  FUZZINESS: {
    title: 'Fuzziness',
    subtitle: 'Round the minutes to the nearest multiple of this number',
  },
};

/**
 * The error messages for the extension
 */
export const Errors: Record<string, string> = {
  ERROR_RETRIEVE_DATE_MENU: 'Error retrieving date menu',
  ERROR_PLACING_CLOCK_LABEL: 'Error placing clock label',
  ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL:
    'Error binding settings to clock label',
  ERROR_INITIALIZING_CLOCK_LABEL: 'Error initializing clock label',
  ERROR_UPDATING_CLOCK_LABEL: 'Error updating clock label',
  ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX: 'Could not find clock display box',
  ERROR_BINDING_SETTINGS_FOR_: 'Error binding settings for',
  ERROR_UNABLE_TO_FORMAT_TIME_STRING: 'Unable to format time string',
  ERROR_UNABLE_TO_FORMAT_DATE_STRING: 'Unable to format date string',
  ERROR_INVALID_TIME_FORMAT: 'Invalid time format',
};
