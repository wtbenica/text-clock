#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function incrementVersion(versionData, type) {
  const newVersion = { ...versionData };

  switch (type) {
    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      break;
    case 'minor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      break;
    case 'patch':
      newVersion.patch += 1;
      break;
    default:
      throw new Error(`Invalid version type: ${type}. Must be major, minor, or patch.`);
  }

  // Always increment build number
  newVersion.build += 1;

  return newVersion;
}

function versionToString(versionData) {
  return `${versionData.major}.${versionData.minor}.${versionData.patch}`;
}

function updateVersionJson(filePath, newVersionData) {
  console.log(`Updating ${filePath}...`);
  fs.writeFileSync(filePath, JSON.stringify(newVersionData, null, 2) + '\n');
  const versionString = versionToString(newVersionData);
  console.log(`✓ Updated version.json to ${versionString} (build ${newVersionData.build})`);
}

function updatePackageJson(filePath, versionString) {
  console.log(`Updating ${filePath}...`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  content.version = versionString;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  console.log(`✓ Updated package.json version to ${versionString}`);
}

function updateMetadataJson(filePath, versionString, buildNumber) {
  console.log(`Updating ${filePath}...`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update version-name (semantic version)
  content['version-name'] = versionString;

  // Update version (build number - always increments)
  content.version = buildNumber;

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  console.log(`✓ Updated metadata.json version-name to ${versionString} and version to ${buildNumber}`);
}

function updateReadme(filePath, currentVersionString, newVersionString) {
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Update header version
  content = content.replace(
    `## Text Clock GNOME Extension v${currentVersionString}`,
    `## Text Clock GNOME Extension v${newVersionString}`
  );

  // Update download link text
  content = content.replace(
    `[ZIP file (v${currentVersionString})]`,
    `[ZIP file (v${newVersionString})]`
  );

  // Update download URL
  content = content.replace(
    `/releases/download/v${currentVersionString}/`,
    `/releases/download/v${newVersionString}/`
  );

  fs.writeFileSync(filePath, content);
  console.log(`✓ Updated README.md version references from ${currentVersionString} to ${newVersionString}`);
}

function main() {
  const type = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');
  const isJsonOutput = process.argv.includes('--json');

  if (!type || !['major', 'minor', 'patch'].includes(type)) {
    console.error('Usage: node bump-version.cjs <major|minor|patch> [--dry-run] [--json]');
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const versionJsonPath = path.join(rootDir, 'version.json');
  const packageJsonPath = path.join(rootDir, 'package.json');
  const metadataJsonPath = path.join(rootDir, 'metadata.json');
  const readmePath = path.join(rootDir, 'README.md');

  // Read current version from version.json
  const currentVersionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  const currentVersionString = versionToString(currentVersionData);

  // Calculate new version
  const newVersionData = incrementVersion(currentVersionData, type);
  const newVersionString = versionToString(newVersionData);

  if (isJsonOutput) {
    console.log(JSON.stringify({
      current: {
        version: currentVersionString,
        build: currentVersionData.build
      },
      new: {
        version: newVersionString,
        build: newVersionData.build
      },
      type: type
    }));
    return;
  }

  console.log(`Current version: ${currentVersionString} (build ${currentVersionData.build})`);
  console.log(`New version: ${newVersionString} (build ${newVersionData.build}) (${type} bump)`);

  if (isDryRun) {
    return; // Exit early for dry run
  }

  console.log('');

  // Update all files
  updateVersionJson(versionJsonPath, newVersionData);
  updatePackageJson(packageJsonPath, newVersionString);
  updateMetadataJson(metadataJsonPath, newVersionString, newVersionData.build);
  updateReadme(readmePath, currentVersionString, newVersionString);

  console.log('');
  console.log(`✅ Successfully bumped version from ${currentVersionString} to ${newVersionString}`);
  console.log(`   Build number: ${currentVersionData.build} → ${newVersionData.build}`);
}

if (require.main === module) {
  main();
}