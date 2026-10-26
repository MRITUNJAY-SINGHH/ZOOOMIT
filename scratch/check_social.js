const fs = require('fs');
const path = require('path');
const dir = 'Website';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let found = 0;
files.forEach(f => {
    const c = fs.readFileSync(path.join(dir, f), 'utf-8');
    const matches = c.match(/https?:\/\/[^\s"']*(facebook|instagram|twitter|x\.com|linkedin|youtube)[^\s"']*/gi);
    if (matches) {
        console.log(f, matches);
        found++;
    }
});
if (!found) console.log('No configured social media URLs found in any HTML file.');
