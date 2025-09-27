import { WordPack } from "../../word_pack.js";
import { createTimeConstants } from "../../constants/times/core.js";
import { createDateConstants } from "../../constants/dates/core.js";
import { GettextFunctions } from "../gettext/gettext_utils.js";

export function createTranslatePack(gettextFns: GettextFunctions): WordPack {
  const timeConstants = createTimeConstants(gettextFns);
  const dateConstants = createDateConstants(gettextFns);
  return new WordPack({
    timesFormatOne: timeConstants.timesFormatOne(),
    midnightFormatOne: timeConstants.midnightFormatOne(),
    noonFormatOne: timeConstants.noonFormatOne(),
    timesFormatTwo: timeConstants.timesFormatTwo(),
    midnightFormatTwo: timeConstants.midnightFormatTwo(),
    noonFormatTwo: timeConstants.noonFormatTwo(),
    names: timeConstants.hourNames(),
    days: dateConstants.weekdays(),
    dayOnly: dateConstants.dateOnly(),
    midnight: timeConstants.midnight(),
    noon: timeConstants.noon(),
    daysOfMonth: dateConstants.daysOfMonth(),
  });
}

export function createTranslatePackGetter(
  gettextFns: GettextFunctions,
): () => WordPack {
  return () => createTranslatePack(gettextFns);
}
