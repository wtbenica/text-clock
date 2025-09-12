## Text Clock GNOME Extension v1.0.6

![Screenshot of Text Clock](media/screenshot.png 'Screenshot of Text Clock Extension')

### Overview

**Text Clock** modifies the GNOME Shell top bar clock to show the time as text.

#### Key Features

- **GNOME Shell Integration:** Replaces the standard clock in the top bar.
- **Time Format Options:** Choose between relative minutes ("ten to three", "five past noon") or hours and minutes ("four thirty", "eleven oh seven").
- **Optional Date Display:** Time-only or time and date display.
- **Fuzziness:** Displays the exact time or fuzzy time, rounded to five, ten, or fifteen minute intervals.

#### Compatibility

**Text Clock** is compatible with GNOME Shell 45 and later.

### Getting Started

#### Installation

You can install the extension from the GNOME Extensions website or manually from the source code.

#### GNOME Extensions

This extension is available on [extensions.gnome.org](https://extensions.gnome.org/extension/7186/text-clock/) for easy installation.

You'll need a browser extension:

- _Chrome-based browsers:_ [Chrome Web Store](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep).

- _Firefox:_ [Mozilla Add-ons site](https://addons.mozilla.org/firefox/addon/gnome-shell-integration/).

- _Opera:_ [Deactivated](https://gnome.pages.gitlab.gnome.org/gnome-browser-integration/images/opera-conversation.png). Use one of the manual methods below.

And a [native host connector](https://gnome.pages.gitlab.gnome.org/gnome-browser-integration/pages/installation-guide.html).

[_Extension Manager_](https://github.com/mjakeman/extension-manager) is also recommended for searching and managing extensions.

#### Installation from ZIP File

You can directly download the extension as a ZIP file:

1. Download this [ZIP file](https://github.com/wtbenica/text-clock/releases/download/v1.0.6/text-clock@benica.dev.zip) from Github.
2. Extract the ZIP file to `~/.local/share/gnome-shell/extensions/`.
3. Restart GNOME Shell for the changes to take effect. On X11, press Alt+F2, type `r`, and then press Enter. On Wayland, log out and back in.

#### Installation from Source

###### Required Dependencies

To use the Makefile for installation, you will need the following dependencies:

- `node` (includes `npm`) or install `yarn` as an alternative package manager
- `perl`
- `make`

###### Pre-Installation Notes:

- **Backup**: As a precaution, you may want to backup your existing GNOME Shell extensions before installation.

- **Path Expansion**: The Makefile uses `$(HOME)` for path expansion. Please ensure that your system correctly expands `$(HOME)` to your home directory.

###### Installation

1. The source files are hosted on GitHub. You can download the source files as a [ZIP file](https://github.com/wtbenica/text-clock/archive/refs/tags/v1.0.4.zip) or clone the repository using Git:

   | Method     | Command                                                  |
   | ---------- | -------------------------------------------------------- |
   | HTTPS      | `git clone https://github.com/benica-dev/text-clock.git` |
   | SSH        | `git clone git@github.com:wtbenica/text-clock.git`       |
   | GitHub CLI | `gh repo clone wtbenica/text-clock`                      |

   Refer to [GitHub's documentation on cloning repositories](https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories) for more information.

2. Navigate to the cloned or extracted directory that contains the Makefile and run:

   ```bash
   make install
   ```

   This installs necessary Node.js packages, compiles the extension, and integrates it into your GNOME environment.

   Restart GNOME Shell for the changes to take effect, On X11, press Alt+F2, type `r`, and then press Enter. On Wayland, log out and back in.

3. After installation, you may delete the cloned repository. To only clean up the build artifacts, run:
   ```bash
   make clean
   ```

#### Usage

###### GUI Method

To enable the extension, use a GUI tool like _GNOME Extensions_ or [_Extensions Manager_](https://github.com/mjakeman/extension-manager), If you don't have one installed, it can be obtained through your distribution's package manager. These tools also provide easy access to the extension's preferences.

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

Note: constants have been moved into `constants/` with `dates/` and `times/` subfolders. Runtime variants that are used by the extension and prefs live under those folders as `extension.ts` and `prefs.ts` respectively.

---

### License

Text Clock is open-sourced under the GNU General Public License v3.0 or later (GPL-3.0-or-later). See the LICENSE file for more details.

---

### Dependency Installation

Below are instructions for installing the required dependencies. These instructions may vary slightly depending on your Linux distribution.

###### Debian/Ubuntu

Install Node.js (which provides npm) and other tools. Optionally install Yarn if you prefer it as the package manager.

```bash
sudo apt update
# Install Node.js + npm
sudo apt install nodejs npm perl make
# Optional: install yarn (recommended for reproducible installs)
# npm install --global yarn
```

###### Fedora

```bash
sudo dnf check-update
# Install Node.js + npm
sudo dnf install nodejs npm perl make
# Optional: install yarn
# npm install --global yarn
```

###### Arch Linux

```bash
sudo pacman -Syu nodejs npm perl make
# Optional: install yarn
# npm install --global yarn
```

###### openSUSE

```bash
sudo zypper refresh
sudo zypper install --no-recommends nodejs npm perl make
# Optional: install yarn
# npm install --global yarn
```

###### Other Distributions

For other Linux distributions, please use your package manager to install Node.js (npm), `perl`, and `make`. If you prefer Yarn, install it instead of using npm. If you encounter any issues, feel free to open an issue for assistance.
