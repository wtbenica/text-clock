import { prefsGettext } from "../../utils/gettext-utils.js";
import { createTimeConstants } from "../times/core.js";

const fns = prefsGettext;
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
