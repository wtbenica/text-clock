import { prefsGettext } from "../../utils/gettext-utils.js";
import { createDateConstants } from "../dates/core.js";

const fns = prefsGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
