import {
    gettext as _,
    ngettext,
    pgettext,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { createTimeConstants } from '../times/core.js';

const fns = { _: _, ngettext: ngettext as any, pgettext };
export const {
    timesFormatOne,
    midnightFormatOne,
    noonFormatOne,
    timesFormatTwo,
    midnightFormatTwo,
    noonFormatTwo,
    hourNames,
    midnight,
    noon,
} = createTimeConstants(fns);
