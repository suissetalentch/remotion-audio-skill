#!/usr/bin/env node

/**
 * Install remotion-audio-skill as a Claude Code skill
 *
 * This script creates a symlink from the user's Claude Code skills directory
 * to this package, enabling the /remotion-audio command.
 *
 * Usage:
 *   npx remotion-audio-install-skill
 *   # or after global install:
 *   remotion-audio-install-skill
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'remotion-audio-skill';

function main() {
  console.log(`\n📦 Installing ${SKILL_NAME} as a Claude Code skill...\n`);

  // Determine paths
  const homeDir = os.homedir();
  const skillsDir = path.join(homeDir, '.claude', 'skills');
  const targetPath = path.join(skillsDir, SKILL_NAME);

  // Find the package root (where SKILL.md lives)
  const packageRoot = findPackageRoot();
  if (!packageRoot) {
    console.error('❌ Error: Could not find package root with SKILL.md');
    process.exit(1);
  }

  const skillMdPath = path.join(packageRoot, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    console.error('❌ Error: SKILL.md not found in package');
    process.exit(1);
  }

  // Create skills directory if it doesn't exist
  if (!fs.existsSync(skillsDir)) {
    console.log(`📁 Creating skills directory: ${skillsDir}`);
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // Remove existing symlink if it exists
  if (fs.existsSync(targetPath)) {
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
      console.log(`🔄 Removing existing symlink...`);
      fs.unlinkSync(targetPath);
    } else {
      console.error(`❌ Error: ${targetPath} exists and is not a symlink`);
      console.error('   Please remove it manually and try again.');
      process.exit(1);
    }
  }

  // Create the symlink
  try {
    fs.symlinkSync(packageRoot, targetPath, 'dir');
    console.log(`✅ Created symlink:`);
    console.log(`   ${targetPath} -> ${packageRoot}\n`);
  } catch (error) {
    if (error.code === 'EPERM' && process.platform === 'win32') {
      console.error('❌ Error: Permission denied. On Windows, run as Administrator');
      console.error('   or enable Developer Mode to create symlinks.');
    } else {
      console.error(`❌ Error creating symlink: ${error.message}`);
    }
    process.exit(1);
  }

  // Success message
  console.log('🎉 Installation complete!\n');
  console.log('You can now use the skill in Claude Code:');
  console.log('   /remotion-audio\n');
  console.log('To verify the installation:');
  console.log(`   ls -la ${skillsDir}\n`);
}

/**
 * Find the package root by looking for SKILL.md
 */
function findPackageRoot() {
  // Start from the script location and go up
  let currentDir = __dirname;

  // If running from node_modules/.bin, adjust
  if (currentDir.includes('node_modules')) {
    // Try to find the actual package
    const nodeModulesIndex = currentDir.indexOf('node_modules');
    const basePath = currentDir.substring(0, nodeModulesIndex);
    const possiblePaths = [
      path.join(basePath, 'node_modules', SKILL_NAME),
      path.join(basePath, 'node_modules', 'remotion-audio-skill'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(path.join(p, 'SKILL.md'))) {
        return p;
      }
    }
  }

  // Walk up from script directory
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'SKILL.md'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Last resort: try process.cwd()
  if (fs.existsSync(path.join(process.cwd(), 'SKILL.md'))) {
    return process.cwd();
  }

  return null;
}

// Run
main();
