const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/\.get\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'view')"));
  content = content.replace(/\.post\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'create')"));
  content = content.replace(/\.put\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'edit')"));
  content = content.replace(/\.delete\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'delete')"));

  content = content.replace(/router\.get\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'view')"));
  content = content.replace(/router\.post\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'create')"));
  content = content.replace(/router\.put\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'edit')"));
  content = content.replace(/router\.delete\([^;]+?\)/g, match => match.replace(/authorize\('([^']+)'\)/g, "authorize('$1', 'delete')"));

  // fallback for any left over
  content = content.replace(/authorize\('([^']+)'\)/g, (match, module) => {
    if (match.includes(',')) return match;
    return `authorize('${module}', 'view')`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done replacing routes');
