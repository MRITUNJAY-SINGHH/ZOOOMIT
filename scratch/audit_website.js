const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, '../Website');

// 1. Gather all files in Website
function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(WEBSITE_DIR);
console.log(`Total files in Website (excluding node_modules): ${allFiles.length}`);

// 2. Separate codebase files from asset files
const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
const cssFiles = allFiles.filter(f => f.endsWith('.css'));
const jsFiles = allFiles.filter(f => f.endsWith('.js') && !f.includes('node_modules'));
const jsonFiles = allFiles.filter(f => f.endsWith('.json') && !f.includes('node_modules'));

console.log(`HTML files: ${htmlFiles.length}`);
console.log(`CSS files: ${cssFiles.length}`);
console.log(`JS files: ${jsFiles.length}`);

// Combine all searchable text from HTML, CSS, JS, and config files
let combinedSearchText = '';
const codeFiles = [...htmlFiles, ...cssFiles, ...jsFiles, ...jsonFiles];

codeFiles.forEach(f => {
  try {
    combinedSearchText += ' ' + fs.readFileSync(f, 'utf8');
  } catch (err) {
    console.error(`Error reading ${f}:`, err);
  }
});

// Also check partials, .htaccess, _redirects, vercel.json
['partials/header.html', '.htaccess', '_redirects', 'vercel.json'].forEach(rel => {
  const p = path.join(WEBSITE_DIR, rel);
  if (fs.existsSync(p)) {
    combinedSearchText += ' ' + fs.readFileSync(p, 'utf8');
  }
});

// 3. Inspect every asset (images, SVGs, fonts, vendor scripts)
const assetFiles = allFiles.filter(f => {
  const rel = path.relative(WEBSITE_DIR, f).replace(/\\/g, '/');
  // Anything inside assets/
  return rel.startsWith('assets/');
});

const usedAssets = [];
const unusedAssets = [];
let usedBytes = 0;
let unusedBytes = 0;

assetFiles.forEach(file => {
  const rel = path.relative(WEBSITE_DIR, file).replace(/\\/g, '/');
  const filename = path.basename(file);
  const size = fs.statSync(file).size;

  // Search by relative path, filename, and filename without extension
  const baseNameNoExt = filename.substring(0, filename.lastIndexOf('.')) || filename;

  const isRelUsed = combinedSearchText.includes(rel);
  const isFilenameUsed = combinedSearchText.includes(filename);
  // Also check if referenced as assets/img/elements/... without 'Website/'
  const isPartialPathUsed = combinedSearchText.includes(rel.replace(/^assets\//, ''));

  if (isRelUsed || isFilenameUsed || isPartialPathUsed) {
    usedAssets.push({ rel, filename, size });
    usedBytes += size;
  } else {
    unusedAssets.push({ rel, filename, size });
    unusedBytes += size;
  }
});

console.log('-------------------------------------------');
console.log(`Total Assets Checked: ${assetFiles.length}`);
console.log(`Used Assets: ${usedAssets.length} (${(usedBytes / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Unused Assets: ${unusedAssets.length} (${(unusedBytes / (1024 * 1024)).toFixed(2)} MB)`);
console.log('-------------------------------------------');

// Breakdown unused by directory
const unusedByDir = {};
unusedAssets.forEach(item => {
  const dirName = path.dirname(item.rel);
  unusedByDir[dirName] = (unusedByDir[dirName] || 0) + 1;
});
console.log('Unused assets by directory:');
console.log(unusedByDir);

// Write detailed audit to scratch/audit_details.json
fs.writeFileSync(
  path.join(__dirname, 'audit_details.json'),
  JSON.stringify({ usedAssets, unusedAssets, unusedByDir }, null, 2),
  'utf8'
);
console.log('Wrote audit details to scratch/audit_details.json');
