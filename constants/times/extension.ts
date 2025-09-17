import { extensionGettext } from "../../utils/gettext-utils.js";
import { createTimeConstants } from "../times/core.js";

const fns = extensionGettext;
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
