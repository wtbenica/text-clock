import Adw from "gi://Adw";
import { prefsGettext } from "../../utils/gettext/index.js";

/**
 * Create and add a PreferencesPage to the window.
 *
 * @param window - Adw.PreferencesWindow instance
 * @returns Adw.PreferencesPage the created page
 */
export function createAndAddPageToWindow(window: Adw.PreferencesWindow) {
  const page = new Adw.PreferencesPage({
    title: prefsGettext._("Text Clock"),
  });
  window.add(page);
  return page;
}

/**
 * Create and add an Adw.PreferencesGroup to a page.
 *
 * @param page - the preferences page
 * @param title_tag - localization key or tag for the group's title
 * @param description_tag - localization key or tag for the group's description
 * @returns Adw.PreferencesGroup the created group
 */
export function createAndAddGroupToPage(
  page: Adw.PreferencesPage,
  title_tag: string,
  description_tag: string,
) {
  const group = new Adw.PreferencesGroup({
    title: prefsGettext._(title_tag),
    description: prefsGettext._(description_tag),
  });
  page.add(group);
  return group;
}
