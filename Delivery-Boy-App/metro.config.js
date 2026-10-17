const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');
const sharedNodeModules = path.resolve(workspaceRoot, 'Mobile-App', 'node_modules');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Ensure modern ESM extensions are supported and prioritized correctly
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

config.watchFolders = [
  projectRoot,
  sharedNodeModules
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  sharedNodeModules
];

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
