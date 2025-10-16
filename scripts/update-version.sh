#!/bin/bash

# SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
#
# SPDX-License-Identifier: GPL-3.0-or-later

# Update version numbers across all project files and optionally rename branch

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [options] <bump-type>"
    echo ""
    echo "Bump types:"
    echo "  patch    Increment patch version (1.0.5 → 1.0.6)"
    echo "  minor    Increment minor version (1.0.5 → 1.1.0)"
    echo "  major    Increment major version (1.0.5 → 2.0.0)"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -n, --dry-run       Show what would be done without executing"
    echo "  --rename-branch     Rename current branch to match new version"
    echo "  --no-git           Update files only, no git operations (no commit, no branch rename)"
    echo "  --force             Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  $0 minor                        # Update version to next minor"
    echo "  $0 --rename-branch minor        # Update version and rename branch"
    echo "  $0 --no-git minor               # Update files only, no git operations"
    echo "  $0 --dry-run major              # Show what would happen"
    echo ""
    echo "This script updates version numbers in:"
    echo "  - package.json"
    echo "  - metadata.json"
    echo "  - README.md"
    echo "  - aur/PKGBUILD"
    echo "  - RELEASE_NOTES.md"
    echo "  - po/*.po files"
    echo "  - Documentation examples in scripts/"
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Parse arguments
DRY_RUN=false
RENAME_BRANCH=false
NO_GIT=false
FORCE=false
BUMP_TYPE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --rename-branch)
            RENAME_BRANCH=true
            shift
            ;;
        --no-git)
            NO_GIT=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        patch|minor|major)
            if [[ -z "$BUMP_TYPE" ]]; then
                BUMP_TYPE="$1"
            else
                log_error "Too many arguments"
                usage
            fi
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            ;;
        *)
            log_error "Invalid bump type: $1"
            usage
            ;;
    esac
done

if [[ -z "$BUMP_TYPE" ]]; then
    log_error "Bump type is required"
    usage
fi

# Check for conflicting options
if [[ "$RENAME_BRANCH" == "true" ]] && [[ "$NO_GIT" == "true" ]]; then
    log_error "Cannot use --rename-branch with --no-git (conflicting options)"
    exit 1
fi

# Check we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "metadata.json" ]]; then
    log_error "This doesn't appear to be the text-clock project root"
    exit 1
fi

# Check if we have uncommitted changes (skip if --no-git)
if [[ "$DRY_RUN" == "false" ]] && [[ "$NO_GIT" == "false" ]] && ! git diff-index --quiet HEAD --; then
    log_error "You have uncommitted changes. Please commit or stash them first."
    log_error "Alternatively, use --no-git to update files without git operations."
    exit 1
fi

# Check if node is available
if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is required for this script"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
CURRENT_BRANCH=$(git branch --show-current)

log_info "Current version: $CURRENT_VERSION"
if [[ "$NO_GIT" == "false" ]]; then
    log_info "Current branch: $CURRENT_BRANCH"
fi

# Calculate new version
calculate_new_version() {
    local current="$1"
    local bump_type="$2"
    
    # Split version into parts
    IFS='.' read -ra VERSION_PARTS <<< "$current"
    local major="${VERSION_PARTS[0]}"
    local minor="${VERSION_PARTS[1]}"
    local patch="${VERSION_PARTS[2]}"
    
    case "$bump_type" in
        patch)
            patch=$((patch + 1))
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

NEW_VERSION=$(calculate_new_version "$CURRENT_VERSION" "$BUMP_TYPE")
if [[ "$NO_GIT" == "false" ]]; then
    NEW_BRANCH="v$NEW_VERSION"
fi

log_info "New version: $NEW_VERSION"
if [[ "$RENAME_BRANCH" == "true" ]]; then
    log_info "New branch name: $NEW_BRANCH"
fi

if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi

if [[ "$NO_GIT" == "true" ]]; then
    log_warn "NO GIT MODE - Files will be updated but no git operations will be performed"
fi

# Confirm with user unless forced
if [[ "$FORCE" == "false" ]] && [[ "$DRY_RUN" == "false" ]]; then
    echo ""
    echo "This will:"
    echo "  - Update version from $CURRENT_VERSION to $NEW_VERSION"
    if [[ "$RENAME_BRANCH" == "true" ]]; then
        echo "  - Rename branch from '$CURRENT_BRANCH' to '$NEW_BRANCH'"
        echo "  - Push new branch and delete old remote branch"
    fi
    echo "  - Update all version references in project files"
    if [[ "$NO_GIT" == "false" ]]; then
        echo "  - Commit all changes"
    else
        echo "  - NO git operations (files only)"
    fi
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cancelled"
        exit 0
    fi
fi

# Function to update file with perl
update_file() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [[ ! -f "$file" ]]; then
        log_warn "File not found: $file"
        return
    fi
    
    log_info "Updating $file: $description"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "  Would apply pattern: $pattern"
        return
    fi
    
    # Use perl for more reliable regex replacement
    perl -i -pe "$pattern" "$file"
}

# Update package.json
log_step "Updating package.json..."
if [[ "$DRY_RUN" == "false" ]]; then
    # Use node to safely update JSON
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '$NEW_VERSION';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    log_info "  ✓ Updated version field to $NEW_VERSION"
else
    log_info "  Would update version field to $NEW_VERSION"
fi

# Update metadata.json
log_step "Updating metadata.json..."
if [[ "$DRY_RUN" == "false" ]]; then
    # Get current version number (integer)
    CURRENT_VERSION_NUM=$(node -p "require('./metadata.json').version")
    NEW_VERSION_NUM=$((CURRENT_VERSION_NUM + 1))
    
    node -e "
        const fs = require('fs');
        const meta = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
        meta['version-name'] = '$NEW_VERSION';
        meta.version = $NEW_VERSION_NUM;
        fs.writeFileSync('metadata.json', JSON.stringify(meta, null, 2) + '\n');
    "
    log_info "  ✓ Updated version-name to $NEW_VERSION and version number to $NEW_VERSION_NUM"
else
    log_info "  Would update version-name to $NEW_VERSION and increment version number"
fi

# Update README.md
log_step "Updating README.md..."
update_file "README.md" \
    "s/Text Clock v[0-9]+\.[0-9]+\.[0-9]+/Text Clock v$NEW_VERSION/g" \
    "header version"

update_file "README.md" \
    "s|download/v[0-9]+\.[0-9]+\.[0-9]+/text-clock\@benica\.dev\.zip|download/v$NEW_VERSION/text-clock@benica.dev.zip|g" \
    "download link"

update_file "README.md" \
    "s/ZIP file \\(v[0-9]+\\.[0-9]+\\.[0-9]+\\)/ZIP file (v$NEW_VERSION)/g" \
    "ZIP file reference"

# Update PKGBUILD (if exists)
if [[ -f "aur/PKGBUILD" ]]; then
    log_step "Updating aur/PKGBUILD..."
    update_file "aur/PKGBUILD" \
        "s/pkgver=[0-9]+\\.[0-9]+\\.[0-9]+/pkgver=$NEW_VERSION/g" \
        "package version"
fi

# Update RELEASE_NOTES.md
log_step "Updating RELEASE_NOTES.md..."
update_file "RELEASE_NOTES.md" \
    "s/# Release Notes: Text Clock v[0-9]+\\.[0-9]+\\.[0-9]+/# Release Notes: Text Clock v$NEW_VERSION/g" \
    "release notes header"

# Update po files
log_step "Updating translation files..."
for po_file in po/*.po; do
    if [[ -f "$po_file" ]]; then
        update_file "$po_file" \
            "s/Project-Id-Version: Text Clock [0-9]+\\.[0-9]+\\.[0-9]+/Project-Id-Version: Text Clock $NEW_VERSION/g" \
            "$(basename "$po_file") project version"
    fi
done

# Update version examples in scripts (be careful to only update examples, not actual version logic)
log_step "Updating script examples..."
for script_file in scripts/*.sh; do
    if [[ -f "$script_file" ]] && [[ "$script_file" != "scripts/update-version.sh" ]]; then
        # Update example version references in comments
        update_file "$script_file" \
            "s/# From your development branch \\(e.g., v[0-9]+\\.[0-9]+\\.[0-9]+\\)/# From your development branch (e.g., v$NEW_VERSION)/g" \
            "$(basename "$script_file") example version in comments"
    fi
done

# Rename branch if requested
if [[ "$RENAME_BRANCH" == "true" ]] && [[ "$NO_GIT" == "false" ]]; then
    log_step "Renaming branch..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "  Would rename '$CURRENT_BRANCH' to '$NEW_BRANCH'"
        log_info "  Would push new branch and delete old remote branch"
    else
        # Rename local branch
        git branch -m "$NEW_BRANCH"
        log_info "  ✓ Renamed local branch to '$NEW_BRANCH'"
        
        # Push new branch
        git push origin HEAD
        log_info "  ✓ Pushed new branch '$NEW_BRANCH'"
        
        # Delete old remote branch if it exists and is different
        if [[ "$CURRENT_BRANCH" != "$NEW_BRANCH" ]] && git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
            git push origin --delete "$CURRENT_BRANCH"
            log_info "  ✓ Deleted old remote branch '$CURRENT_BRANCH'"
        fi
        
        # Set upstream
        git branch --set-upstream-to=origin/"$NEW_BRANCH"
        log_info "  ✓ Set upstream to origin/$NEW_BRANCH"
    fi
fi

# Stage and commit changes (skip if --no-git)
if [[ "$DRY_RUN" == "false" ]] && [[ "$NO_GIT" == "false" ]]; then
    log_step "Committing changes..."
    
    # Add all the files we modified
    git add package.json metadata.json README.md RELEASE_NOTES.md po/*.po
    if [[ -f "aur/PKGBUILD" ]]; then
        git add aur/PKGBUILD
    fi
    # Add any updated scripts (but be selective)
    find scripts/ -name "*.sh" -not -name "update-version.sh" -exec git add {} \; 2>/dev/null || true
    
    # Check if we actually have changes to commit
    if git diff --cached --quiet; then
        log_warn "No changes to commit"
    else
        # Commit changes
        git commit -m "Update version to $NEW_VERSION

- Updated package.json version field
- Updated metadata.json version-name and version number  
- Updated README.md version references and download links
- Updated RELEASE_NOTES.md header
- Updated translation files project version$(if [[ -f "aur/PKGBUILD" ]]; then echo $'\n- Updated AUR PKGBUILD version'; fi)$(if [[ "$RENAME_BRANCH" == "true" ]]; then echo $'\n- Renamed branch to '$NEW_BRANCH; fi)"

        log_info "  ✓ Committed version update"
    fi
fi

echo ""
log_info "🎉 Version update complete!"
if [[ "$DRY_RUN" == "false" ]]; then
    log_info "Updated from: $CURRENT_VERSION → $NEW_VERSION"
    if [[ "$RENAME_BRANCH" == "true" ]]; then
        log_info "Branch renamed to: $NEW_BRANCH"
    fi
    
    if [[ "$NO_GIT" == "true" ]]; then
        log_info "Files have been updated (no git operations performed)."
        echo ""
        log_info "📝 Next steps:"
        log_info "  1. Review the file changes"
        log_info "  2. Commit the changes: git add . && git commit -m 'Update version to $NEW_VERSION'"
        log_info "  3. Continue development"
    else
        log_info "All files have been updated and changes committed."
        
        if [[ "$RENAME_BRANCH" == "false" ]]; then
            echo ""
            log_info "📝 Next steps:"
            log_info "  1. Review the changes: git show HEAD"
            log_info "  2. Continue development on this branch"
            log_info "  3. When ready: make release-full"
        else
            echo ""
            log_info "📝 Next steps:"
            log_info "  1. Review the changes: git show HEAD"
            log_info "  2. Continue development on branch: $NEW_BRANCH"
            log_info "  3. When ready: make release-full"
        fi
    fi
else
    log_info "Use --force to skip confirmation or remove --dry-run to apply changes"
fi