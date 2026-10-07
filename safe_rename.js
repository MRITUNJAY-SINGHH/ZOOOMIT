const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    if (file === 'node_modules' || file.startsWith('.')) return;
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        filelist = walkSync(dirFile, filelist);
      } else {
        filelist.push(dirFile);
      }
    } catch(e) {}
  });
  return filelist;
};

const exts = ['.js', '.jsx', '.json', '.html', '.md', '.env'];
let files = walkSync('./Mobile-App').concat(walkSync('./Backend')).concat(walkSync('./Admin'));
files = files.filter(f => !f.includes('dist') && !f.includes('build') && exts.some(ext => f.endsWith(ext)));

let updatedCount = 0;

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    let lines = content.split('\n');
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // skip classNames, imports, file paths
      if (line.includes('className=') || line.includes('import ') || line.includes('from \'') || line.includes('from \"') || line.includes('require(') || line.includes('export ')) {
        continue;
      }
      
      let newLine = line
        .replace(/\bKuiklo\b/g, 'ZOOOMIT')
        .replace(/\bZooom\b/g, 'ZOOOMIT')
        .replace(/\bKUIKLO\b/g, 'ZOOOMIT')
        .replace(/\bZOOOM\b/g, 'ZOOOMIT');
        
      if (line !== newLine) {
        lines[i] = newLine;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(f, lines.join('\n'), 'utf8');
      console.log('Updated', f);
      updatedCount++;
    }
  } catch(e) {}
});

console.log('Updated', updatedCount, 'files.');
