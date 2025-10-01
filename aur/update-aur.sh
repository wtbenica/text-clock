#!/bin/bash

# SPDX-FileCopyrightText: Arch Linux contributors
# SPDX-License-Identifier: 0BSD

# Script to update AUR package files when a new release is made
#
# This script will:
# 1. Verify GitHub release v<version> exists (download asset to compute checksum)
# 2. Update AUR package files (PKGBUILD, .SRCINFO)
# 3. Optionally operate in dry-run mode (no file changes)
# 4. Exit with non-zero on any failure
#
# CLI flags (compatible style with scripts/sync-to-aur.sh):
# --dry-run          Perform a non-destructive run; print changes but don't modify files
# --version X.Y.Z    Specify the version to operate on (overrides positional arg)
# -h|--help          Show this help text
#
# Usage: ./update-aur.sh [--dry-run] [--version X.Y.Z] <version>
# Example: ./update-aur.sh --dry-run --version 1.0.7

set -euo pipefail

# Configuration
PKGNAME="gnome-shell-extension-text-clock"
GITHUB_REPO="wtbenica/text-clock"
AUR_DIR="$(dirname "$0")"
if [[ -f "./PKGBUILD" ]]; then
    AUR_DIR="$(pwd)"
else
    AUR_DIR="$(dirname "$0")"
fi

# Initialize variables
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.7"
    exit 1
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
VERSION=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --version=*)
            VERSION="${1#*=}"
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                log_error "Multiple version arguments provided"
                usage
            fi
            shift
            ;;
    esac
done

# Check that we have a version
if [[ -z "$VERSION" ]]; then
    log_error "Version is required"
    usage
fi

# Validate version format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    log_error "Invalid version format. Expected: X.Y.Z"
    exit 1
fi

# Announce
log_info "Updating AUR package to version $VERSION"

# Download the release to get SHA256
RELEASE_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/text-clock@benica.dev.zip"
TEMP_FILE=$(mktemp)

log_info "Downloading release to calculate SHA256..."
RELEASE_ZIP_NAME="text-clock@benica.dev.zip"
RELEASE_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${RELEASE_ZIP_NAME}"
TEMP_FILE=$(mktemp)

log_info "Attempting to download release archive: $RELEASE_URL"
if ! curl -fSL --retry 3 --retry-delay 2 -o "$TEMP_FILE" "$RELEASE_URL"; then
    log_error "Failed to download release archive from: $RELEASE_URL"
    log_error "Check that the GitHub release 'v${VERSION}' exists for ${GITHUB_REPO} and that the asset '${RELEASE_ZIP_NAME}' is present and public."
    rm -f "$TEMP_FILE"
    exit 1
fi

# Optional: download detached signature and verify if GPG key info provided
SIG_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/${RELEASE_ZIP_NAME}.sig"
SIG_TEMP=$(mktemp)
if [[ -n "${GPG_PUBKEY:-}" || -n "${VALID_PGP_KEYS:-}" ]]; then
    log_info "Attempting to download detached signature: ${SIG_URL}"
    if curl -fSL --retry 2 --retry-delay 1 -o "$SIG_TEMP" "$SIG_URL"; then
        log_info "Signature downloaded to $SIG_TEMP"
        # Import provided public key if available
        if [[ -n "${GPG_PUBKEY:-}" ]]; then
            echo "$GPG_PUBKEY" | gpg --batch --import || { log_error "Failed to import provided GPG public key"; rm -f "$TEMP_FILE" "$SIG_TEMP"; exit 1; }
        fi
        # Verify signature
        if gpg --verify "$SIG_TEMP" "$TEMP_FILE" >/dev/null 2>&1; then
            log_info "GPG signature verification PASSED"
        else
            log_error "GPG signature verification FAILED"
            rm -f "$TEMP_FILE" "$SIG_TEMP"
            exit 1
        fi
    else
        log_warn "No detached signature found at $SIG_URL - continuing without GPG verification"
        rm -f "$SIG_TEMP"
    fi
fi

# Calculate SHA256
SHA256=$(sha256sum "$TEMP_FILE" | cut -d' ' -f1)
rm -f "$TEMP_FILE"

log_info "SHA256: $SHA256"

# Update PKGBUILD
if [[ "$DRY_RUN" == true ]]; then
    log_info "Dry-run mode: showing changes that would be applied to PKGBUILD"
    echo "--- PKGBUILD (updates) ---"
    echo "s/^pkgver=.*/pkgver=${VERSION}/"
    echo "s/^pkgrel=.*/pkgrel=1/"
    echo "s/^sha256sums=.*/sha256sums=('${SHA256}')/"
    echo
    echo "Would regenerate .SRCINFO using: makepkg --printsrcinfo > .SRCINFO (requires makepkg)"
    log_info "Dry-run complete. No files modified."
    exit 0
fi

log_info "Updating PKGBUILD..."
sed -i "s/^sha256sums=.*/sha256sums=('${SHA256}')/" "$AUR_DIR/PKGBUILD"

# Generate .SRCINFO
log_info "Generating .SRCINFO..."
cd "$AUR_DIR"
if command -v makepkg >/dev/null 2>&1; then
    makepkg --printsrcinfo > .SRCINFO
else
    log_error "makepkg is required to regenerate .SRCINFO. Aborting."
    exit 1
fi

log_info "AUR package files updated successfully!"
echo
log_info "Next steps:"
echo "1. Review the changes in $AUR_DIR/"
echo "2. Test the package: makepkg -si"
echo "3. Commit to AUR repo: git add -A && git commit -m 'Update to v${VERSION}'"
echo "4. Push to AUR: git push"