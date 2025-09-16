import { extensionGettext } from "../../utils/gettext-utils.js";
import { createDateConstants } from "../dates/core.js";

const fns = extensionGettext;
export const { dateOnly, weekdays, daysOfMonth } = createDateConstants(fns);
