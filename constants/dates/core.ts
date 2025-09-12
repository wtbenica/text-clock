/* Shared date constants (core) - do not import runtime gettext here. */

export type GettextFns = {
  _: (s: string) => string;
  ngettext: (s: string, p: string, n: number) => string;
  pgettext: (ctx: string, s: string) => string;
};

export function createDateConstants(fns: GettextFns) {
  const { _, pgettext } = fns;

  const dateOnly: () => string = () =>
    pgettext(
      'This is how someone would say the day of the month only. As in, "My rent is due on the %s."',
      "the %s",
    );

  const weekdays: () => string[] = () => [
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Sunday the fifth".',
      "sunday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Monday the sixth".',
      "monday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Tuesday the seventh".',
      "tuesday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Wednesday the eighth".',
      "wednesday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Thursday the ninth".',
      "thursday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Friday the tenth".',
      "friday the %s",
    ),
    pgettext(
      'The day of the week and the date. The date will be substituted in the %s. For example, "Saturday the eleventh".',
      "saturday the %s",
    ),
  ];

  const daysOfMonth: () => string[] = () => [
    _("first"),
    _("second"),
    _("third"),
    _("fourth"),
    _("fifth"),
    _("sixth"),
    _("seventh"),
    _("eighth"),
    _("ninth"),
    _("tenth"),
    _("eleventh"),
    _("twelfth"),
    _("thirteenth"),
    _("fourteenth"),
    _("fifteenth"),
    _("sixteenth"),
    _("seventeenth"),
    _("eighteenth"),
    _("nineteenth"),
    _("twentieth"),
    _("twenty first"),
    _("twenty second"),
    _("twenty third"),
    _("twenty fourth"),
    _("twenty fifth"),
    _("twenty sixth"),
    _("twenty seventh"),
    _("twenty eighth"),
    _("twenty ninth"),
    _("thirtieth"),
    _("thirty first"),
  ];

  return {
    dateOnly,
    weekdays,
    daysOfMonth,
  } as const;
}
