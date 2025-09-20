#!/bin/bash

# SPDX-FileCopyrightText: Arch Linux contributors
# SPDX-License-Identifier: 0BSD

# Script to update AUR package files when a new release is made

set -euo pipefail

# Configuration
PKGNAME="gnome-shell-extension-text-clock"
GITHUB_REPO="wtbenica/text-clock"
AUR_DIR="$(dirname "$0")"

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

# Check arguments
if [ $# -ne 1 ]; then
    usage
fi

VERSION="$1"

# Validate version format
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    log_error "Invalid version format. Expected: X.Y.Z"
    exit 1
fi

log_info "Updating AUR package to version $VERSION"

# Download the release to get SHA256
RELEASE_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/text-clock@benica.dev.zip"
TEMP_FILE=$(mktemp)

log_info "Downloading release to calculate SHA256..."
if ! curl -sL "$RELEASE_URL" -o "$TEMP_FILE"; then
    log_error "Failed to download release from $RELEASE_URL"
    log_error "Make sure the release exists on GitHub"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Calculate SHA256
SHA256=$(sha256sum "$TEMP_FILE" | cut -d' ' -f1)
rm -f "$TEMP_FILE"

log_info "SHA256: $SHA256"

# Update PKGBUILD
log_info "Updating PKGBUILD..."
sed -i "s/^pkgver=.*/pkgver=${VERSION}/" "$AUR_DIR/PKGBUILD"
sed -i "s/^pkgrel=.*/pkgrel=1/" "$AUR_DIR/PKGBUILD"
sed -i "s/^sha256sums=.*/sha256sums=('${SHA256}')/" "$AUR_DIR/PKGBUILD"

# Generate .SRCINFO
log_info "Generating .SRCINFO..."
cd "$AUR_DIR"
if command -v makepkg >/dev/null 2>&1; then
    makepkg --printsrcinfo > .SRCINFO
else
    log_warn "makepkg not found, manually updating .SRCINFO..."
    sed -i "s/^	pkgver = .*/	pkgver = ${VERSION}/" .SRCINFO
    sed -i "s/^	pkgrel = .*/	pkgrel = 1/" .SRCINFO
    sed -i "s|^	source = .*|	source = ${PKGNAME}-${VERSION}.zip::https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}/text-clock@benica.dev.zip|" .SRCINFO
    sed -i "s/^	sha256sums = .*/	sha256sums = ${SHA256}/" .SRCINFO
fi

log_info "AUR package files updated successfully!"
echo
log_info "Next steps:"
echo "1. Review the changes in $AUR_DIR/"
echo "2. Test the package: makepkg -si"
echo "3. Commit to AUR repo: git add -A && git commit -m 'Update to v${VERSION}'"
echo "4. Push to AUR: git push"