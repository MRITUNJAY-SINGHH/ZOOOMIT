const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function createAppComposite() {
    // 1. Resize home-banner.png (the phone mockup)
    // home-banner is 859 x 1832
    // Let's resize it to height 700
    const phone = await sharp(path.join(__dirname, '../Website/assets/img/th-3/home-banner.png'))
        .resize({ height: 700, fit: 'contain' })
        .toBuffer();
    
    const phoneMeta = await sharp(phone).metadata();

    // 2. Load the bag from shopping-experience.jpg / extracted-bag.png
    // Resize bag to height 600
    const bag = await sharp(path.join(__dirname, '../Website/assets/img/zooomit/extracted-bag.png'))
        .resize({ height: 580, fit: 'contain' })
        .toBuffer();
    
    const bagMeta = await sharp(bag).metadata();

    // 3. Create a canvas wide enough for both
    // Phone in front (left), Bag behind (right)
    const canvasWidth = phoneMeta.width + bagMeta.width - 150;
    const canvasHeight = 720;

    const composite = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        // Bag on right, slightly behind
        {
            input: bag,
            top: canvasHeight - bagMeta.height,
            left: phoneMeta.width - 180
        },
        // Phone on left, in front
        {
            input: phone,
            top: canvasHeight - phoneMeta.height,
            left: 0
        }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-app-showcase.png'));

    console.log('Successfully created footer-app-showcase.png, size:', canvasWidth, 'x', canvasHeight);
}

createAppComposite().catch(console.error);
