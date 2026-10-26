const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../Website');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let totalErrors = 0;

files.forEach(f => {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract footer
  const startMarker = '<!--...::: Footer Section Start :::... -->';
  const endMarker = '<!--...::: Footer Section End :::... -->';
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1) {
    console.error('ERROR: Footer missing in ' + f);
    totalErrors++;
    return;
  }

  const footer = content.substring(start, end + endMarker.length);

  // Check for href="#"
  if (footer.includes('href="#"') || footer.includes("href='#'")) {
    console.error('ERROR: Dead link href="#" found in footer of ' + f);
    totalErrors++;
  }

  // Check for fitness / old masco terms
  const prohibited = ['fitness', 'masco', 'reach your goals'];
  prohibited.forEach(term => {
    if (footer.toLowerCase().includes(term)) {
      console.error('ERROR: Prohibited term "' + term + '" found in footer of ' + f);
      totalErrors++;
    }
  });

  // Check for image paths
  const imgMatches = Array.from(footer.matchAll(/src=["']([^"']+)["']/g));
  for (const match of imgMatches) {
    const src = match[1];
    const assetPath = path.join(dir, src);
    if (!fs.existsSync(assetPath)) {
      console.error('ERROR: Image asset does not exist: ' + src + ' in ' + f);
      totalErrors++;
    }
  }

  // Check for link targets
  const linkMatches = Array.from(footer.matchAll(/href=["']([^"']+)["']/g));
  for (const match of linkMatches) {
    const href = match[1];
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
      continue;
    }
    const cleanHref = href.split('#')[0];
    if (cleanHref) {
      const linkPath = path.join(dir, cleanHref);
      if (!fs.existsSync(linkPath)) {
        console.error('ERROR: Link target does not exist: ' + href + ' in ' + f);
        totalErrors++;
      }
    }
  }
});

if (totalErrors === 0) {
  console.log('SUCCESS: All ' + files.length + ' HTML files validated with 0 errors in the footer!');
} else {
  console.error('FAILED: ' + totalErrors + ' total errors found.');
  process.exit(1);
}
