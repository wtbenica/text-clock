// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";

/**
 * Create and add a PreferencesPage to the window.
 *
 * @param window - Adw.PreferencesWindow instance
 * @param title - Already translated title string
 * @param icon_name - Icon name for the page
 * @returns Adw.PreferencesPage the created page
 */
export function createAndAddPageToWindow(
  window: Adw.PreferencesWindow,
  title: string,
  icon_name: string,
) {
  const pageProps: any = { title };
  pageProps.icon_name = icon_name;
  const page = new Adw.PreferencesPage(pageProps);
  window.add(page);
  return page;
}

/**
 * Create and add an Adw.PreferencesGroup to a page.
 *
 * @param page - the preferences page
 * @param title - Already translated title string
 * @param description - Already translated description string
 * @returns Adw.PreferencesGroup the created group
 */
export function createAndAddGroupToPage(
  page: Adw.PreferencesPage,
  title: string,
  description: string,
) {
  const group = new Adw.PreferencesGroup({
    title,
    description,
  });
  page.add(group);
  return group;
}
