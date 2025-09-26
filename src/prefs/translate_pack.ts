import { createTranslatePackGetter } from "../utils/translate";
import { prefsGettext } from "../utils/gettext";

/**
 * A function that returns the translate pack scoped for the preferences UI.
 *
 * Many prefs helpers require localized text. `TRANSLATE_PACK` exposes a
 * `() => TranslatePack` getter bound to the prefs gettext function so callers
 * can obtain localized strings without depending on runtime gettext state.
 */
export const TRANSLATE_PACK = createTranslatePackGetter(prefsGettext);

export default TRANSLATE_PACK;
