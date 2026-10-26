const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function extractProduce() {
    const input = path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png');
    
    // In newsletter-image.png (859 x 1188):
    // The bottom area contains fresh produce on transparent background
    // Bottom right (x: 600-859, y: 700-1188) has broccoli, yellow pepper, basil
    // Bottom left (x: 0-450, y: 600-1188) has bananas, milk, tomato, basil
    
    // Let's create an isolated footer produce element
    const bottomVeg = await sharp(input)
        .extract({ left: 600, top: 720, width: 259, height: 450 })
        .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-right.png'));
        
    const bottomLeft = await sharp(input)
        .extract({ left: 40, top: 650, width: 380, height: 500 })
        .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Extracted produce snippets');
}

extractProduce().catch(console.error);
