const fs = require('fs');

const rootLayout = fs.readFileSync('Mobile-App/src/app/_layout.jsx', 'utf8');
const tabsLayout = fs.readFileSync('Mobile-App/src/app/(tabs)/_layout.jsx', 'utf8');

console.log('rootLayout has SafeAreaProvider:', rootLayout.includes('SafeAreaProvider'));
console.log('rootLayout has SafeAreaView:', rootLayout.includes('SafeAreaView'));
console.log('tabsLayout has SafeAreaView:', tabsLayout.includes('SafeAreaView'));
console.log('tabsLayout has SafeAreaProvider:', tabsLayout.includes('SafeAreaProvider'));

