#!/usr/bin/env node

// SPDX-FileCopyrightText: 2024-2025 Wesley Benica <wesley@benica.dev>
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Convenience wrapper around update-version.sh for starting development branches.
 * 
 * This script delegates to update-version.sh with --no-git --force flags,
 * which updates version files without git operations or interactive prompts.
 * 
 * Usage:
 *   node start-dev-branch.cjs <major|minor|patch> [--dry-run] [--json]
 * 
 * Options:
 *   --dry-run   Show what would be changed without modifying files
 *   --json      Output current/new version info in JSON format (implies --dry-run)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  const type = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');
  const isJsonOutput = process.argv.includes('--json');

  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    console.error('Usage: node start-dev-branch.cjs <major|minor|patch> [--dry-run] [--json]');
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const updateVersionScript = path.join(__dirname, 'update-version.sh');

  if (!fs.existsSync(updateVersionScript)) {
    console.error('Error: update-version.sh not found at:', updateVersionScript);
    process.exit(1);
  }

  // Handle --json output
  if (isJsonOutput) {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const metadataJsonPath = path.join(rootDir, 'metadata.json');

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const metadataJson = JSON.parse(fs.readFileSync(metadataJsonPath, 'utf8'));

    const currentVersion = packageJson.version;
    const currentMetadataVersion = metadataJson.version || 0;

    // Calculate new version
    const parts = currentVersion.split('.').map(n => parseInt(n, 10));
    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
    }
    const newVersion = parts.join('.');
    const newMetadataVersion = currentMetadataVersion + 1;

    console.log(JSON.stringify({
      current: {
        version: currentVersion,
        metadataVersion: currentMetadataVersion
      },
      new: {
        version: newVersion,
        metadataVersion: newMetadataVersion
      },
      type: type
    }));
    return;
  }

  // Build command arguments
  const args = [updateVersionScript];

  if (isDryRun) {
    args.push('--dry-run');
  } else {
    // Use --force to skip interactive prompts and --no-git to skip git operations
    args.push('--no-git', '--force');
  }

  args.push(type);

  // Execute update-version.sh
  try {
    execSync(args.join(' '), {
      cwd: rootDir,
      stdio: 'inherit',
      shell: '/bin/bash'
    });
  } catch (error) {
    console.error('Error executing update-version.sh');
    process.exit(error.status || 1);
  }
}

if (require.main === module) {
  main();
}