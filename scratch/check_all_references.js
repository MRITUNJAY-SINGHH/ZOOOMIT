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

// 2. Identify code files to scan
const codeFiles = allFiles.filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ['.html', '.css', '.js', '.json', '.htaccess'].includes(ext) || f.endsWith('_redirects');
});

// Build a set of all extracted paths and references
const referencedStrings = new Set();

// Regular expressions to extract file references
const regexes = [
  /src=["']([^"']+)["']/gi,
  /href=["']([^"']+)["']/gi,
  /url\(["']?([^"')]+)["']?\)/gi,
  /poster=["']([^"']+)["']/gi,
  /<link[^>]+href=["']([^"']+)["']/gi,
  /["']([^"']+\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff|woff2|ttf|eot|css|js))["']/gi
];

codeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  regexes.forEach(re => {
    let match;
    while ((match = re.exec(content)) !== null) {
      let ref = match[1].trim().split('?')[0].split('#')[0];
      if (ref && !ref.startsWith('http://') && !ref.startsWith('https://') && !ref.startsWith('mailto:') && !ref.startsWith('tel:') && !ref.startsWith('data:')) {
        referencedStrings.add(ref);
        referencedStrings.add(path.basename(ref));
      }
    }
  });

  // Also extract any word tokens that might be partial image names or icon names
  const words = content.match(/[a-zA-Z0-9_\-\.\/]+/g) || [];
  words.forEach(w => {
    if (w.includes('/') || w.includes('.')) {
      referencedStrings.add(w);
      referencedStrings.add(path.basename(w));
    }
  });
});

console.log(`Total extracted reference tokens: ${referencedStrings.size}`);

// 3. Check every single asset in Website/assets/
const assetFiles = allFiles.filter(f => {
  const rel = path.relative(WEBSITE_DIR, f).replace(/\\/g, '/');
  return rel.startsWith('assets/');
});

const usedAssets = [];
const unusedAssets = [];

assetFiles.forEach(f => {
  const rel = path.relative(WEBSITE_DIR, f).replace(/\\/g, '/');
  const filename = path.basename(f);
  const relNoAssets = rel.replace(/^assets\//, '');

  let isUsed = false;

  for (const ref of referencedStrings) {
    if (ref === rel || ref === filename || ref === relNoAssets || ref.endsWith('/' + filename)) {
      isUsed = true;
      break;
    }
  }

  const stat = fs.statSync(f);
  const info = {
    absPath: f,
    relPath: rel,
    filename,
    sizeBytes: stat.size,
    sizeKB: (stat.size / 1024).toFixed(1)
  };

  if (isUsed) {
    usedAssets.push(info);
  } else {
    unusedAssets.push(info);
  }
});

console.log('-------------------------------------------');
console.log(`Total assets scanned: ${assetFiles.length}`);
console.log(`Used assets: ${usedAssets.length} (${(usedAssets.reduce((s, a) => s + a.sizeBytes, 0) / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Unused assets: ${unusedAssets.length} (${(unusedAssets.reduce((s, a) => s + a.sizeBytes, 0) / 1024 / 1024).toFixed(2)} MB)`);
console.log('-------------------------------------------');

// Breakdown unused by category/folder
const categoryBreakdown = {};
unusedAssets.forEach(a => {
  const dir = path.dirname(a.relPath);
  categoryBreakdown[dir] = (categoryBreakdown[dir] || 0) + 1;
});
console.log('Unused assets breakdown:');
console.table(categoryBreakdown);

fs.writeFileSync(
  path.join(__dirname, 'detailed_asset_audit.json'),
  JSON.stringify({ usedAssets, unusedAssets, categoryBreakdown }, null, 2),
  'utf8'
);
