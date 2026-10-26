const fs = require('fs');
const path = require('path');

const WEBSITE_DIR = path.join(__dirname, '../Website');

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

let totalErrors = 0;
let checkedAssets = 0;
let checkedLinks = 0;

console.log('================ POST-CLEANUP VALIDATION ================');

// 1. Verify all target pages exist
TARGET_FILES.forEach(page => {
  const pagePath = path.join(WEBSITE_DIR, page);
  if (!fs.existsSync(pagePath)) {
    console.error(`[ERROR] Retained page missing: ${page}`);
    totalErrors++;
  }
});

// 2. Scan every retained HTML page for missing images, scripts, stylesheets, and links
TARGET_FILES.forEach(page => {
  const pagePath = path.join(WEBSITE_DIR, page);
  if (!fs.existsSync(pagePath)) return;

  const content = fs.readFileSync(pagePath, 'utf8');

  // Check <img> tags
  const imgMatches = Array.from(content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
  imgMatches.forEach(m => {
    const src = m[1].trim().split('?')[0].split('#')[0];
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return;

    checkedAssets++;
    const assetPath = path.join(WEBSITE_DIR, src);
    if (!fs.existsSync(assetPath)) {
      console.error(`[ERROR] Missing image in ${page}: ${src}`);
      totalErrors++;
    }
  });

  // Check <link rel="stylesheet"> and <link rel="icon">
  const linkMatches = Array.from(content.matchAll(/<link[^>]+href=["']([^"']+)["']/gi));
  linkMatches.forEach(m => {
    const href = m[1].trim().split('?')[0].split('#')[0];
    if (href.startsWith('data:') || href.startsWith('http://') || href.startsWith('https://')) return;

    checkedAssets++;
    const assetPath = path.join(WEBSITE_DIR, href);
    if (!fs.existsSync(assetPath)) {
      console.error(`[ERROR] Missing linked asset in ${page}: ${href}`);
      totalErrors++;
    }
  });

  // Check <script src="...">
  const scriptMatches = Array.from(content.matchAll(/<script[^>]+src=["']([^"']+)["']/gi));
  scriptMatches.forEach(m => {
    const src = m[1].trim().split('?')[0].split('#')[0];
    if (src.startsWith('http://') || src.startsWith('https://')) return;

    checkedAssets++;
    const assetPath = path.join(WEBSITE_DIR, src);
    if (!fs.existsSync(assetPath)) {
      console.error(`[ERROR] Missing script in ${page}: ${src}`);
      totalErrors++;
    }
  });

  // Check internal <a> href links
  const aMatches = Array.from(content.matchAll(/<a[^>]+href=["']([^"']+)["']/gi));
  aMatches.forEach(m => {
    const href = m[1].trim();
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;

    checkedLinks++;
    const cleanHref = href.split('?')[0].split('#')[0];
    if (cleanHref) {
      const linkPath = path.join(WEBSITE_DIR, cleanHref);
      if (!fs.existsSync(linkPath)) {
        console.error(`[ERROR] Broken link in ${page}: ${href}`);
        totalErrors++;
      }
    }
  });
});

// 3. Scan CSS files for missing font/image url() references
const cssFiles = ['assets/css/style.css', 'assets/css/style.min.css', 'assets/css/custom.css'];
cssFiles.forEach(cssRel => {
  const cssPath = path.join(WEBSITE_DIR, cssRel);
  if (!fs.existsSync(cssPath)) return;

  const content = fs.readFileSync(cssPath, 'utf8');
  const urlMatches = Array.from(content.matchAll(/url\(["']?([^"')]+)["']?\)/gi));

  urlMatches.forEach(m => {
    let ref = m[1].trim().split('?')[0].split('#')[0];
    if (ref.startsWith('data:') || ref.startsWith('http://') || ref.startsWith('https://')) return;

    checkedAssets++;
    // Relative to CSS file directory
    const resolvedPath = path.resolve(path.dirname(cssPath), ref);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[ERROR] Missing asset in ${cssRel}: ${ref}`);
      totalErrors++;
    }
  });
});

console.log(`Total Asset References Checked: ${checkedAssets}`);
console.log(`Total Hyperlinks Checked: ${checkedLinks}`);
console.log(`Total Errors Detected: ${totalErrors}`);

if (totalErrors === 0) {
  console.log('✓ SUCCESS: 100% of referenced assets, scripts, stylesheets, and links exist and load correctly!');
} else {
  console.error(`✗ FAILED with ${totalErrors} errors.`);
  process.exit(1);
}
