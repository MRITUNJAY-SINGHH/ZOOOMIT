/**
 * ZOOOMIT - Header Build & Synchronization Tool
 * Single Source of Truth: Website/partials/header.html
 *
 * This script synchronizes the shared master header into every retained HTML page.
 * Run automatically during build (`npm run build`) or manually (`npm run build:header`).
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PARTIAL_HEADER_PATH = path.join(ROOT_DIR, 'partials', 'header.html');

// Retained HTML pages in the ZOOOMIT website
const TARGET_FILES = [
  'index.html',
  'about.html',
  'contact.html',
  'faq.html',
  'privacy-policy.html',
  'terms-and-conditions.html',
  'shipping-policy.html',
  'return-refund-policy.html',
  'delete-account.html',
  '404.html',
  'error-404.html'
];

function loadMasterHeader() {
  if (!fs.existsSync(PARTIAL_HEADER_PATH)) {
    throw new Error(`Master header partial not found at: ${PARTIAL_HEADER_PATH}`);
  }
  const raw = fs.readFileSync(PARTIAL_HEADER_PATH, 'utf8');
  return raw.trim();
}

function syncHeaderToPage(fileName, masterHeader) {
  const filePath = path.join(ROOT_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] File not found, skipping: ${fileName}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Match header block with or without comment markers
  const headerBlockRegex = /(<!--\.\.\.::: Header Start :::\.\.\. -->[\s\S]*?<!--\.\.\.::: Header End :::\.\.\. -->|<header[\s\S]*?<\/header>)/i;

  if (!headerBlockRegex.test(content)) {
    console.error(`[ERROR] No header block or <header> tag found in: ${fileName}`);
    return false;
  }

  const updatedContent = content.replace(headerBlockRegex, masterHeader);

  // Validation: ensure exactly one header exists and it contains expected navigation links
  const headerCount = (updatedContent.match(/<header/gi) || []).length;
  if (headerCount !== 1) {
    throw new Error(`Validation failed for ${fileName}: expected 1 <header> tag, found ${headerCount}`);
  }

  const requiredAnchors = [
    'href="index.html"',
    'href="index.html#section-features"',
    'href="index.html#section-about"',
    'href="faq.html"',
    'href="contact.html"',
    'https://play.google.com/store/apps/details?id=com.zooomit.app&pcampaignid=web_share'
  ];

  for (const anchor of requiredAnchors) {
    if (!updatedContent.includes(anchor)) {
      throw new Error(`Validation failed for ${fileName}: missing expected link ${anchor}`);
    }
  }

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return true;
}

function buildAll() {
  console.log('----------------------------------------------------');
  console.log('ZOOOMIT: Synchronizing Master Header across all pages');
  console.log(`Source: partials/header.html`);
  console.log('----------------------------------------------------');

  const masterHeader = loadMasterHeader();
  let successCount = 0;

  for (const file of TARGET_FILES) {
    const success = syncHeaderToPage(file, masterHeader);
    if (success) {
      console.log(`✓ Synchronized header in: ${file}`);
      successCount++;
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Successfully updated ${successCount} of ${TARGET_FILES.length} pages.`);
  console.log('----------------------------------------------------');
}

// Watch mode support
if (process.argv.includes('--watch')) {
  buildAll();
  console.log(`[WATCH] Watching ${PARTIAL_HEADER_PATH} for changes...`);
  fs.watchFile(PARTIAL_HEADER_PATH, { interval: 500 }, () => {
    console.log(`\n[CHANGE] ${PARTIAL_HEADER_PATH} updated. Re-syncing headers...`);
    try {
      buildAll();
    } catch (err) {
      console.error('[ERROR]', err.message);
    }
  });
} else {
  buildAll();
}
