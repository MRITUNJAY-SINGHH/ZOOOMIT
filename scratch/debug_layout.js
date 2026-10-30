const fs = require('fs');

const code = fs.readFileSync('Mobile-App/src/app/(tabs)/index.jsx', 'utf8');
const mandala = fs.readFileSync('Mobile-App/src/components/home/HeaderMandalaBg.jsx', 'utf8');

console.log('Mandala code:\n', mandala);

