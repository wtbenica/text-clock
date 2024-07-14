## Text Clock GNOME Extension

![Screenshot of Text Clock](media/screenshot.png 'Screenshot of Text Clock Extension')

### Overview

The Text Clock extension for GNOME Shell changes the top bar clock to show the time as text,

### Key Features

- **GNOME Shell Integration:** Replaces the standard clock in the top bar.
- **Time Format Options:** Shows time as relative minutes ("ten to three", "five past noon") or exact hours and minutes ("four thirty", "eleven oh seven").
- **Optional Date Display:** Users can choose whether to also show the date.
- **Fuzziness:** Displays the exact time or fuzzy time, rounded to five, ten, or fifteen minute intervals.

---

### Getting Started

#### Installation

**_GNOME Extensions_**
Once the extension is approved on [extensions.gnome.org](https://extensions.gnome.org), that should be your preferred method of installing. Until then, though, the extension can be installed manually.

**_Manual Installation_**

1. Before installing Text Clock manually, ensure you have the following dependencies installed:

   - **Node.js:** Required for compiling TypeScript files.
   - **Git:** Required for cloning the repository.
   - **npm:** Required for installing Node.js packages.
   - **Glib-compile-schemas:** Required for compiling GSettings schemas.
   - **Perl:** Required for patching TypeScript definition files during installation.

2. To install the Text Clock extension, run the following commands in your terminal:

   ```bash
   git clone https://github.com/benica-dev/text-clock.git
   cd text-clock
   make install
   ```

   This command clones the repository, installs necessary Node.js packages, compiles the extension, and integrates it into your GNOME environment.

   For the installation to take effect, a restart of GNOME Shell is necessary. On X11, you can restart GNOME Shell by pressing Alt+F2, typing r, and then pressing Enter. On Wayland, however, you will need to log out and then log back in.

3. After the installation, you can clean up the build artifacts by running:
   ```bash
   make clean
   ```
   If you like, you can also remove the cloned repository by running:
   ```bash
   cd ..
   rm -rf text-clock
   ```
   **Warning:** The command `rm -rf text-clock` will forcefully remove the `text-clock` directory and all its contents without prompting for confirmation. Use this command with caution, and ensure you are in the correct directory and have the command entered correctly before executing it.

#### Usage

Upon installation, enable the Text Clock extension via the GNOME Extensions App. The time will then be displayed in textual format in the top bar.

---

### Contributing

Contributions are welcome and valued. For bug reports, feature suggestions, or contributions, please initiate contact by opening an issue or submitting a pull request.

---

### License

Text Clock is open-sourced under the GNU General Public License v3.0 or later (GPL-3.0-or-later). For more information, please see the LICENSE file.
