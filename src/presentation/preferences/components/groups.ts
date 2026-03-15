// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";

/** Create and add PreferencesPage to window. */
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

/** Create and add PreferencesGroup to page. */
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
