const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'Website');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const yearElement')) {
    // Replace the inline script block
    const updated = content.replace(/\s*<script>\s*const yearElement = document\.getElementById\(["']current-year["']\);[\s\S]*?<\/script>/g, '');
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log('Cleaned redundant script in:', f);
    }
  }
});
