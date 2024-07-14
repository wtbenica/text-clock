## Text Clock GNOME Extension

![Screenshot of Text Clock](media/screenshot.png 'Screenshot of Text Clock Extension')

#### Overview

Text Clock modifies the GNOME Shell top bar clock to show the time as text,

#### Key Features

- **GNOME Shell Integration:** Replaces the standard clock in the top bar.
- **Time Format Options:** Shows time as relative minutes ("ten to three", "five
  past noon") or exact hours and minutes ("four thirty", "eleven oh seven").
- **Optional Date Display:** Users can choose whether to also show the date.
- **Fuzziness:** Displays the exact time or fuzzy time, rounded to five, ten, or
  fifteen minute intervals.

---

#### Getting Started

##### Installation

###### GNOME Extensions

This extension is not yet available on the GNOME Extensions store. To install,
follow the _Manual Installation_ instructions below.

###### Manual Installation

1. Before installing Text Clock manually, ensure you have the following
   dependencies installed (installation instructions below):

   - **Node.js:** Required for compiling TypeScript files.
   - **Git:** Required for cloning the repository.
   - **npm:** Required for installing Node.js packages.
   - **Glib-compile-schemas:** Required for compiling GSettings schemas.
   - **Perl:** Required for patching TypeScript definition files during
     installation.

2. Warnings before installing:

   - **Backup:** It's a good practice to backup your existing GNOME Shell
     extensions before running the `make install` command to prevent accidental
     loss of data.

   - **Path Expansion:** The Makefile uses `$(HOME)` for path expansion to
     ensure compatibility across different environments. Please ensure that your
     environment correctly expands `$(HOME)` to your home directory.

3. To install the Text Clock extension, run the following commands in your
   terminal:

   ```bash
   git clone https://github.com/benica-dev/text-clock.git
   cd text-clock
   make install
   ```

   This command clones the repository, installs necessary Node.js packages,
   compiles the extension, and integrates it into your GNOME environment.

   For the installation to take effect, a restart of GNOME Shell is necessary.
   On X11, you can restart GNOME Shell by pressing Alt+F2, typing r, and then
   pressing Enter. On Wayland, however, you will need to log out and then log
   back in.

4. After the installation, you can clean up the build artifacts by running:
   ```bash
   make clean
   ```
   If you like, you can also remove the cloned repository by running:
   ```bash
   cd ..
   rm -rf text-clock
   ```
   **Warning:** The command `rm -rf text-clock` will forcefully remove the
   `text-clock` directory and all its contents without prompting for
   confirmation. Use this command with caution, and ensure you are in the
   correct directory and have the command entered correctly before executing it.

##### Usage

Upon installation, enable the Text Clock extension via the GNOME Extensions App.
The time will then be displayed in textual format in the top bar.

---

#### Contributing

Contributions are welcome and valued. For bug reports, feature suggestions, or
contributions, please initiate contact by opening an issue or submitting a pull
request.

---

#### License

Text Clock is open-sourced under the GNU General Public License v3.0 or later
(GPL-3.0-or-later). For more information, please see the LICENSE file.

---

#### Dependency Installation Instructions

These instructions provide guidance on installing the necessary dependencies.
They have not been tested on all distributions, so please refer to your
distribution's package manager for the exact package names if you encounter any
issues.

##### Debian/Ubuntu

```bash
sudo apt update
sudo apt install nodejs npm git libglib2.0-bin perl
```

##### Fedora

```bash
sudo dnf check-update
sudo dnf install nodejs npm git glib2-devel perl
```

##### Arch Linux

```bash
sudo pacman -Syu
sudo pacman -S nodejs npm git glib2 perl
```

##### openSUSE

```bash
sudo zypper refresh
sudo zypper install nodejs npm git glib2-devel perl
```

##### Other Distributions

For users of other Linux distributions not explicitly mentioned above, please
install the dependencies using your distribution's package manager. The required
packages are generally named `nodejs`, `npm`, `git`, `glib2` (or its development
packages), and `perl`. You may need to search for the exact package names if
they differ from those listed here. If you encounter any issues, feel free to
open an issue for assistance.
