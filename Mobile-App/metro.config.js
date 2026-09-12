const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure modern ESM extensions are supported and prioritized correctly
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// Enable modern package exports resolution for packages with .mjs / exports maps
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
