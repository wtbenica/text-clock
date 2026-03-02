// SPDX-FileCopyrightText: 2024 Wesley Benica <wesley@benica.dev>
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import { PAGE_ICONS } from "../../../constants/preferences.js";
import SettingsKey from "../../../models/settings_keys.js";
import { prefsGettext } from "../../../utils/gettext/gettext_utils_prefs.js";
import { createAndAddGroupToPage, createAndAddPageToWindow } from "../components/groups.js";
import { logErr } from "../../../utils/error_utils.js";
import { CustomMessage, Recurrence } from "../../../models/custom_message.js";

/**
 * Create the Custom Messages preferences page.
 * Stores messages in the GSettings string-array key defined by the schema.
 */
export function createCustomMessagesPage(window: Adw.PreferencesWindow, settings: Gio.Settings) {
  const { _ } = prefsGettext;

  const page = createAndAddPageToWindow(window, _("Custom Messages"), PAGE_ICONS.GENERAL);
  const group = createAndAddGroupToPage(
    page,
    _("Custom Messages"),
    _("Store a list of user-defined text clock messages"),
  );

  // Container for the editor controls
  const editorBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 8 });

  // Date chooser row
  const dateRowBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
  const dateLabel = new Gtk.Label({ label: _("Date"), xalign: 0 });
  dateLabel.set_hexpand(true);
  const dateButton = new Gtk.Button({ label: _("Pick a date") });
  dateRowBox.append(dateLabel);
  dateRowBox.append(dateButton);

  // Calendar widget (toggled visible when the button is clicked)
  const calendar = new Gtk.Calendar();
  calendar.visible = false;
  dateButton.connect("clicked", () => {
    calendar.visible = !calendar.visible;
  });

  // Message entry (disabled until a date is picked)
  const messageEntry = new Gtk.Entry();
  messageEntry.set_placeholder_text(_("Enter a custom message"));
  messageEntry.sensitive = false;

  // Recurrence combo (none, yearly, monthly)
  const recurrenceStrings = [_("None"), _("Yearly"), _("Monthly")];
  const recurrenceModel = new Gtk.StringList({ strings: recurrenceStrings });
  const recurrenceRow = new Adw.ComboRow({
    title: _("Recurrence"),
    subtitle: _("When the message should repeat"),
    model: recurrenceModel,
    selected: 0,
  });
  recurrenceRow.sensitive = false;

  // Action buttons
  const buttonsBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
  const saveButton = new Gtk.Button({ label: _("Save") });
  const deleteButton = new Gtk.Button({ label: _("Delete") });
  buttonsBox.append(saveButton);
  buttonsBox.append(deleteButton);
  saveButton.sensitive = false;
  deleteButton.sensitive = false;

  // List of messages (date-sorted)
  const listBox = new Gtk.ListBox();

  // Helper: load messages from settings
  function loadMessages(): CustomMessage[] {
    try {
      const raw = settings.get_strv(SettingsKey.CUSTOM_DATE_MESSAGES as any);
      const parsed: CustomMessage[] = raw
        .map((s) => {
          try {
            const obj = JSON.parse(s);
            return new CustomMessage(obj);
          } catch (e) {
            logErr(e, "Failed to parse custom message from settings");
            return null;
          }
        })
        .filter((m) => m !== null) as CustomMessage[];
      return parsed.sort((a, b) => (a.date || "") < (b.date || "") ? -1 : 1);
    } catch (e) {
      logErr(e, "Failed to read custom messages from settings");
      return [];
    }
  }

  // Helper: persist messages to settings
  function saveMessages(messages: CustomMessage[]) {
    try {
      const raw = messages.map((m) => JSON.stringify(m));
      settings.set_strv(SettingsKey.CUSTOM_DATE_MESSAGES as any, raw);
      rebuildList();
    } catch (e) {
      logErr(e, "Failed to save custom messages to settings");
    }
  }

  // Rebuild the visible list from settings
  function rebuildList() {
    listBox.remove_all();
    const messages = loadMessages();
    for (const msg of messages) {
      const rowBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 });
      const label = new Gtk.Label({ label: `${msg.date} — ${msg.message}`, xalign: 0 });
      label.set_hexpand(true);
      const editBtn = new Gtk.Button({ label: _("Edit") });
      const rmBtn = new Gtk.Button({ label: _("Remove") });
      rowBox.append(label);
      rowBox.append(editBtn);
      rowBox.append(rmBtn);

      const listRow = new Gtk.ListBoxRow();
      listRow.set_child(rowBox);
      listBox.append(listRow);

      editBtn.connect("clicked", () => {
        if (!msg.date) return;
        dateButton.label = msg.date;
        messageEntry.text = msg.message;
        recurrenceRow.selected = msg.recurrence === Recurrence.Yearly ? 1 : msg.recurrence === Recurrence.Monthly ? 2 : 0;
        // Enable editor controls when editing an existing message
        messageEntry.sensitive = true;
        recurrenceRow.sensitive = true;
        saveButton.sensitive = true;
        deleteButton.sensitive = true;
      });

      rmBtn.connect("clicked", () => {
        const msgs = loadMessages().filter((m) => m.date !== msg.date);
        saveMessages(msgs);
      });
    }
  }

  // Initialize list
  rebuildList();

  // Add calendar to the editor UI so it becomes visible when toggled
  editorBox.append(dateRowBox);
  editorBox.append(calendar);

  // When a date is selected in the calendar, update the button and entry state
  calendar.connect("day-selected", () => {
    const [y, m, d] = [calendar.get_year(), calendar.get_month() + 1, calendar.get_day()];
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const iso = `${y}-${mm}-${dd}`;
    dateButton.label = iso;
    calendar.visible = false;

    // Load message for this date if present
    const existing = loadMessages().find((m) => m.date === iso);
    if (existing) {
      messageEntry.text = existing.message;
      recurrenceRow.selected = existing.recurrence === Recurrence.Yearly ? 1 : existing.recurrence === Recurrence.Monthly ? 2 : 0;
      // enable controls
      messageEntry.sensitive = true;
      recurrenceRow.sensitive = true;
      saveButton.sensitive = true;
      deleteButton.sensitive = true;
    } else {
      messageEntry.text = "";
      recurrenceRow.selected = 0;
      // enable editor so user can enter a new message
      messageEntry.sensitive = true;
      recurrenceRow.sensitive = true;
      saveButton.sensitive = true;
      deleteButton.sensitive = false;
    }
  });

  // Save button handler
  saveButton.connect("clicked", () => {
    const iso = dateButton.label === _("Pick a date") ? "" : dateButton.label;
    if (!iso) return; // require date before saving
    const text = messageEntry.text || "";
    const rec = recurrenceRow.selected === 1 ? Recurrence.Yearly : recurrenceRow.selected === 2 ? Recurrence.Monthly : Recurrence.None;

    const messages = loadMessages();
    const existing = messages.find((m) => m.date === iso);
    if (existing) {
      existing.update({ message: text, recurrence: rec });
    } else {
      messages.push(new CustomMessage({ date: iso, message: text, recurrence: rec }));
    }
    // sort and persist
    messages.sort((a, b) => (a.date || "") < (b.date || "") ? -1 : 1);
    saveMessages(messages);
    // after save, allow deletion
    deleteButton.sensitive = true;
  });

  // Delete button handler - remove for selected date
  deleteButton.connect("clicked", () => {
    const iso = dateButton.label === _("Pick a date") ? "" : dateButton.label;
    if (!iso) return;
    const messages = loadMessages().filter((m) => m.date !== iso);
    saveMessages(messages);
    // clear editor and disable controls
    messageEntry.text = "";
    messageEntry.sensitive = false;
    recurrenceRow.selected = 0;
    recurrenceRow.sensitive = false;
    deleteButton.sensitive = false;
    dateButton.label = _("Pick a date");
  });

  // Build the editor UI
  editorBox.append(messageEntry);
  editorBox.append(recurrenceRow);
  editorBox.append(buttonsBox);

  group.add(editorBox);
  group.add(listBox);

  return page;
}

export default { createCustomMessagesPage };
