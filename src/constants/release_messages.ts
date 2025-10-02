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

  /** Features highlighted in the update notification for existing users */
  features: {
    /** Primary feature to highlight for updates */
    primary: (gettext: GettextFunctions) => string;

    /** Optional secondary features for updates (shown as bullet points or comma-separated) */
    secondary?: Array<(gettext: GettextFunctions) => string>;
  };

  /** Features highlighted in the welcome notification for new users */
  welcomeFeatures?: {
    /** Primary feature to highlight for new installs */
    primary: (gettext: GettextFunctions) => string;

    /** Optional secondary features for new installs */
    secondary?: Array<(gettext: GettextFunctions) => string>;
  };

  /** Optional custom notification title (defaults to "Text Clock updated" or "Text Clock") */
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
    welcomeFeatures: {
      primary: ({ _ }) =>
        _("Complete color customization with accent-based and custom themes."),
      secondary: [
        ({ _ }) => _("Modern preferences interface"),
        ({ _ }) => _("Flexible divider customization"),
        ({ _ }) => _("Comprehensive translations"),
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
 * Generate a formatted notification message for a version.
 *
 * @param version - Version string
 * @param gettext - Gettext functions for translation
 * @param isFirstInstall - Whether this is a first install (affects messaging style)
 * @param formatAsList - Whether to format secondary features as a bullet list (default: true)
 * @returns Formatted notification body text
 */
export function generateUpdateMessage(
  version: string,
  gettext: GettextFunctions,
  isFirstInstall: boolean = false,
  formatAsList: boolean = true,
): string {
  const releaseInfo = getReleaseInfo(version);

  if (!releaseInfo) {
    // Fallback for versions without specific release info
    if (isFirstInstall) {
      return gettext._("Check Preferences to explore features.");
    }
    return gettext._("Check Preferences for new features.");
  }

  const { _ } = gettext;

  // Choose appropriate feature set based on install type
  const featureSet =
    isFirstInstall && releaseInfo.welcomeFeatures
      ? releaseInfo.welcomeFeatures
      : releaseInfo.features;

  const primaryFeature = featureSet.primary(gettext);

  if (featureSet.secondary && featureSet.secondary.length > 0) {
    const secondaryFeatures = featureSet.secondary.map((fn) => fn(gettext));

    if (formatAsList) {
      // Format as bullet list with primary feature as intro
      const bulletList = secondaryFeatures
        .map((item) => `• ${item}`)
        .join("\n");
      return `${primaryFeature}\n${bulletList}`;
    } else {
      // Legacy comma-separated format
      const secondaryText = secondaryFeatures.join(", ");
      if (isFirstInstall) {
        return _("Features: %s Additional capabilities: %s")
          .replace("%s", primaryFeature)
          .replace("%s", secondaryText);
      } else {
        return _("New: %s Additional improvements: %s")
          .replace("%s", primaryFeature)
          .replace("%s", secondaryText);
      }
    }
  }

  return primaryFeature;
}

/**
 * Get the notification title for a version update.
 *
 * @param version - Version string
 * @param gettext - Gettext functions for translation
 * @param isFirstInstall - Whether this is a first install (no previous version seen)
 * @returns Notification title
 */
export function getNotificationTitle(
  version: string,
  gettext: GettextFunctions,
  isFirstInstall: boolean = false,
): string {
  const releaseInfo = getReleaseInfo(version);

  if (releaseInfo?.customTitle) {
    return releaseInfo.customTitle(gettext);
  }

  if (isFirstInstall) {
    return gettext._("Text Clock %s").replace("%s", version);
  }

  return gettext._("Text Clock updated to %s").replace("%s", version);
}
