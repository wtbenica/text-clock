import {
    gettext as _,
    ngettext,
    pgettext,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { createDateConstants } from '../dates/core.js';

const fns = { _: _, ngettext: ngettext as any, pgettext };
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
