// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { GettextFunctions } from "../utils/gettext/gettext_utils.js";

/**
 * Release-specific messages and metadata.
 *
 * This file contains translatable strings and metadata for specific releases.
 * When bumping versions, add new entries here with appropriate release messages.
 * All strings use gettext for proper internationalization.
 */

export interface ReleaseInfo {
  /** The version this release info applies to */
  version: string;

  /** Features highlighted in the update notification */
  features: {
    /** Primary feature to highlight */
    primary: (gettext: GettextFunctions) => string;

    /** Optional secondary features (shown as bullet points or comma-separated) */
    secondary?: Array<(gettext: GettextFunctions) => string>;
  };

  /** Optional custom notification title (defaults to "Text Clock updated") */
  customTitle?: (gettext: GettextFunctions) => string;
}

/**
 * Release information for different versions.
 * Add new entries when releasing new versions.
 */
export const RELEASE_MESSAGES: Record<string, ReleaseInfo> = {
  "1.1.0": {
    version: "1.1.0",
    features: {
      primary: ({ _ }) =>
        _("Complete color customization with accent-based and custom themes."),
      secondary: [
        ({ _ }) => _("Enhanced preferences interface"),
        ({ _ }) => _("Divider customization options"),
        ({ _ }) => _("Improved translations"),
      ],
    },
  },
};

/**
 * Get release information for a specific version.
 *
 * @param version - Version string (e.g., "1.0.6")
 * @returns Release info if found, undefined otherwise
 */
export function getReleaseInfo(version: string): ReleaseInfo | undefined {
  return RELEASE_MESSAGES[version];
}

/**
 * Generate a formatted update notification message for a version.
 *
 * @param version - Version string
 * @param gettext - Gettext functions for translation
 * @returns Formatted notification body text
 */
export function generateUpdateMessage(
  version: string,
  gettext: GettextFunctions,
): string {
  const releaseInfo = getReleaseInfo(version);

  if (!releaseInfo) {
    // Fallback for versions without specific release info
    return gettext._("Check Preferences for new features.");
  }

  const { _ } = gettext;
  const primaryFeature = releaseInfo.features.primary(gettext);

  if (
    releaseInfo.features.secondary &&
    releaseInfo.features.secondary.length > 0
  ) {
    const secondaryFeatures = releaseInfo.features.secondary
      .map((fn) => fn(gettext))
      .join(", ");

    return _("New: %s Additional improvements: %s")
      .replace("%s", primaryFeature)
      .replace("%s", secondaryFeatures);
  }

  return primaryFeature;
}

/**
 * Get the notification title for a version update.
 *
 * @param version - Version string
 * @param gettext - Gettext functions for translation
 * @returns Notification title
 */
export function getUpdateNotificationTitle(
  version: string,
  gettext: GettextFunctions,
): string {
  const releaseInfo = getReleaseInfo(version);

  if (releaseInfo?.customTitle) {
    return releaseInfo.customTitle(gettext);
  }

  return gettext._("Text Clock updated to %s").replace("%s", version);
}
