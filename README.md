## Text Clock GNOME Extension v1.0.5

[![Release](https://img.shields.io/github/v/release/wtbenica/text-clock?label=release)](https://github.com/wtbenica/text-clock/releases)
[![License](https://img.shields.io/github/license/wtbenica/text-clock)](LICENSE)
[![Issues](https://img.shields.io/github/issues/wtbenica/text-clock)](https://github.com/wtbenica/text-clock/issues)
![Dependabot alerts](https://img.shields.io/github/issues-raw/wtbenica/text-clock/dependabot)
![CI](https://github.com/wtbenica/text-clock/actions/workflows/validate.yml/badge.svg)

![Screenshot of Text Clock](media/screenshot.png "Screenshot of Text Clock Extension")

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

#### With Extensions Manager

The simplest way to install the extension is using [_Extensions Manager_](https://github.com/mjakeman/extension-manager). It can install, enable, disable, and configure extensions directly.

#### From AUR (Arch Linux)

Arch Linux users can install the extension from the AUR:

```bash
# Using an AUR helper (recommended)
yay -S gnome-shell-extension-text-clock

# Or manually
git clone https://aur.archlinux.org/gnome-shell-extension-text-clock.git
cd gnome-shell-extension-text-clock
makepkg -si
```

This installs the extension system-wide and is managed by the package manager.

#### From extensions.gnome.org

This extension is available on [extensions.gnome.org](https://extensions.gnome.org/extension/7186/text-clock/). To use the site, you'll need to install a couple of components:

- The browser extension
  - _Chrome-based browsers:_ [Chrome Web Store](https://chrome.google.com/webstore/detail/gnome-shell-integration/gphhapmejobijbbhgpjhcjognlahblep).

  - _Firefox:_ [Mozilla Add-ons site](https://addons.mozilla.org/firefox/addon/gnome-shell-integration/).

  - _Opera:_ [Deactivated](https://gnome.pages.gitlab.gnome.org/gnome-browser-integration/images/opera-conversation.png). Use one of the manual methods below.

- The [native host connector](https://gnome.pages.gitlab.gnome.org/gnome-browser-integration/pages/installation-guide.html) so the site can enable/disable extensions.

#### From a ZIP File

You can download the latest release of the extension as a ZIP file:

1. Download this [ZIP file (v1.0.5)](https://github.com/wtbenica/text-clock/releases/download/v1.0.5/text-clock@benica.dev.zip) from Github.
2. Extract the ZIP file to `~/.local/share/gnome-shell/extensions/`.
3. Restart GNOME Shell for the changes to take effect. On Wayland, log out and back in. On X11, press Alt+F2, type `r`, and then press Enter.

#### From Source

###### Required Dependencies

To use the Makefile for installation, you will need the following dependencies:

- `make` (for running the Makefile)
- `node`
- `yarn` (v4.x)
- `perl`
- `glib-compile-schemas`

You can verify your system has the required tools by running `make check-deps`.

###### Pre-Installation Notes:

- **Backup**: As a precaution, you may want to backup your existing GNOME Shell extensions before installation.

- **Path Expansion**: The Makefile uses `$(HOME)` for path expansion. Please ensure that your system correctly expands `$(HOME)` to your home directory.

###### Installation

1. The source files are hosted on GitHub. You can download the source files as a [ZIP file](https://github.com/wtbenica/text-clock/archive/refs/heads/main.zip) or clone the repository using Git:

   | Method     | Command                                                  |
   | ---------- | -------------------------------------------------------- |
   | HTTPS      | `git clone https://github.com/benica-dev/text-clock.git` |
   | SSH        | `git clone git@github.com:wtbenica/text-clock.git`       |
   | GitHub CLI | `gh repo clone wtbenica/text-clock`                      |

   Refer to [GitHub's documentation on cloning repositories](https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories) for more information.

2. Navigate to the cloned or extracted directory that contains the Makefile and run:

   **For user installation (recommended):**

   ```bash
   make install
   ```

   **For system-wide installation:**

   ```bash
   sudo make install-system
   ```

   This compiles the extension and installs it into your GNOME Shell extensions directory.
   - `make install` installs to `~/.local/share/gnome-shell/extensions/` (user-only)
   - `make install-system` installs to `/usr/share/gnome-shell/extensions/` (all users)

   Restart GNOME Shell for the changes to take effect. On Wayland, log out and back in. On X11, press Alt+F2, type `r`, and then press Enter.

3. After installation, you may delete the cloned repository. To only clean up the build artifacts, run:
   ```bash
   make clean
   ```

###### Uninstallation

To uninstall the extension:

```bash
make uninstall           # Remove from user directory
sudo make uninstall-system  # Remove from system directory (if installed system-wide)
```

#### Managing the Extension

###### GUI Method

You can use a GUI tool like [_Extensions Manager_](https://github.com/mjakeman/extension-manager) or _GNOME Extensions_ to disable, enable, uninstall, and configure extensions.

###### Command Line

To disable the extension (but leave it installed), run:

```bash
gnome-extensions disable text-clock@benica.dev
```

To enable the extension from the command line:

```bash
gnome-extensions enable text-clock@benica.dev
```

To access the preferences, run:

```bash
gnome-extensions prefs text-clock@benica.dev
```

To remove the extension completely, run:

```bash
gnome-extensions uninstall text-clock@benica.dev
```

---

### Contributing

Contributions, including bug reports and feature suggestions, are welcome. Please use the issue tracker or submit a pull request.

---

### License

Text Clock is open-sourced under the GNU General Public License v3.0 or later (GPL-3.0-or-later). See the LICENSE file for more details.
