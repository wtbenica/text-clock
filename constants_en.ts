// TODO: These need to be gettexted but because of how/where they're used, I'm not ready to undertake that
export const PrefItems = {
  SHOW_DATE: {
    title: "Show Date",
    subtitle: "Show the date in the clock",
  },
  SHOW_WEEKDAY: {
    title: "Show Weekday",
    subtitle: "Show the weekday as part of the date",
  },
  TIME_FORMAT: {
    title: "Time Format",
    subtitle: "Write the time out in this format",
  },
  FUZZINESS: {
    title: "Fuzziness",
    subtitle: "Round the minutes to the nearest multiple of this number",
  },
};

export const Errors = {
  ERROR_RETRIEVE_DATE_MENU: "Error retrieving date menu",
  ERROR_PLACING_CLOCK_LABEL: "Error placing clock label",
  ERROR_BINDING_SETTINGS_TO_CLOCK_LABEL:
    "Error binding settings to clock label",
  ERROR_INITIALIZING_CLOCK_LABEL: "Error initializing clock label",
  ERROR_UPDATING_CLOCK_LABEL: "Error updating clock label",
  ERROR_COULD_NOT_FIND_CLOCK_DISPLAY_BOX: "Could not find clock display box",
  ERROR_BINDING_SETTINGS_FOR_: "Error binding settings for",
  ERROR_UNABLE_TO_FORMAT_TIME_STRING: "Unable to format time string",
  ERROR_UNABLE_TO_FORMAT_DATE_STRING: "Unable to format date string",
  ERROR_INVALID_TIME_FORMAT: "Invalid time format",
};
