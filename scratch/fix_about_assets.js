const fs = require('fs');
const path = require('path');

const aboutPath = path.join(__dirname, '../Website/about.html');
let content = fs.readFileSync(aboutPath, 'utf8');

// Replace broken gallery images
content = content.replace(
  'assets/img/th-1/about-gallery-img-1.jpg',
  'assets/img/th-3/3D-Grocery-Cart-App.png'
);
content = content.replace(
  'assets/img/th-1/about-gallery-img-2.jpg',
  'assets/img/th-3/fresh-grocery-bag.png'
);
content = content.replace(
  'assets/img/th-1/about-gallery-img-3.jpg',
  'assets/img/th-3/home-banner.png'
);

// Replace hero video image & blockquote avatar
content = content.replace(
  'assets/img/th-1/hero-img.jpg',
  'assets/img/th-3/newsletter-image.png'
);
content = content.replace(
  'assets/img/th-1/about-hero-user-blockquote-img.jpg',
  'assets/img/th-3/hero-avater-1.jpg'
);

// Replace brand slider dummy images with ZOOOMIT logo
content = content.replace(/assets\/img\/th-1\/brand-\d\.png/g, 'assets/img/logo-zooomit.svg');

fs.writeFileSync(aboutPath, content, 'utf8');
console.log('✓ Successfully mapped missing template assets in about.html to valid active ZOOOMIT assets');
