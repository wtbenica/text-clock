## Text Clock GNOME Extension

![Screenshot of Text Clock](media/screenshot.png 'Screenshot of Text Clock Extension')

### Overview

**Text Clock** modifies the GNOME Shell top bar clock to show the time as text.

#### Key Features

- **GNOME Shell Integration:** Replaces the standard clock in the top bar.
- **Time Format Options:** Choose between relative minutes ("ten to three", "five past noon") or hours and minutes ("four thirty", "eleven oh seven").
- **Optional Date Display:** Time-only or time and date display.
- **Fuzziness:** Displays the exact time or fuzzy time, rounded to five, ten, or fifteen minute intervals.

---

### Getting Started

#### Installation

###### Note on Availability

This extension is not yet available on [extensions.gnome.org](https://extensions.gnome.org). Please follow the manual installation instructions provided below.

###### Manual Installation

Before proceeding with the manual installation of _Text Clock_, ensure the following dependencies are installed:

- `npm`
- `perl`
- `make`
- `git` (only needed if cloning the repository)

###### Pre-Installation Notes:

- **Backup**: As a precaution, you may want to backup your existing GNOME Shell extensions before installation.

- **Path Expansion**: The Makefile uses `$(HOME)` for path expansion. Please ensure that your system correctly expands `$(HOME)` to your home directory.

###### Installation Instructions

1. Clone the **Text Clock** repository from GitHub with the following command:

   ```bash
   git clone https://github.com/benica-dev/text-clock.git
   ```

   Alternatively, you can download a ZIP file from the [GitHub page](https://github.com/wtbenica/text-clock) and extract it to your preferred directory.

2. Next, navigate to the `text-clock-main` directory (or your chosen directory) and run:

   ```bash
   make install
   ```

   This installs necessary Node.js packages, compiles the extension, and integrates it into your GNOME environment.

   Restart GNOME Shell for the changes to take effect, On X11, press Alt+F2, type `r`, and then press Enter. On Wayland, log out and back in.

3. After installation, you may delete the repository or the downloaded and extracted files. To clean up the build artifacts, run:
   ```bash
   make clean
   ```

#### Usage

###### GUI Method

To enable the extension, use a GUI tool like _GNOME Extensions_ or _Extensions Manager_, If you don't have one installed, it can be obtained through your distribution's package manager. These tools also provide easy access to the extension's preferences.

###### Command Line

To enable the extension from the command line:

```bash
gnome-extensions enable text-clock@benica.dev
```

To access the preferences, run:

```bash
gnome-extensions prefs text-clock@benica.dev
```

---

### Contributing

Contributions, including bug reports and feature suggestions, are welcome. Please use the issue tracker or submit a pull request.

---

### License

Text Clock is open-sourced under the GNU General Public License v3.0 or later (GPL-3.0-or-later). See the LICENSE file for more details.

---

### Dependency Installation

Below are instructions for installing the required dependencies. These instructions may vary slightly depending on your Linux distribution.

###### Debian/Ubuntu

```bash
sudo apt update
sudo apt install npm perl make git
```

###### Fedora

```bash
sudo dnf check-update
sudo dnf install npm perl make git
```

###### Arch Linux

```bash
sudo pacman -Syu npm perl make git
```

###### openSUSE

```bash
sudo zypper refresh
sudo zypper install --no-recommends npm perl make git
```

###### Other Distributions

For other Linux distributions, please use your package manager to install `npm`, `perl`, `make`, and `git`. If you encounter any issues, feel free to open an issue for assistance.
