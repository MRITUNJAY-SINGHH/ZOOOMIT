const fs = require('fs');

const indexCode = fs.readFileSync('Mobile-App/src/app/(tabs)/index.jsx', 'utf8');

// Let's find stickyHeader JSX
const stickyMatch = indexCode.match(/<View style=\{\[styles\.stickyHeader[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/);
console.log(stickyMatch ? stickyMatch[0].slice(0, 500) : 'Not found');

