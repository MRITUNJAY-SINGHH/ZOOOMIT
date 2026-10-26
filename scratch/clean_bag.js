const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function cleanBag() {
    const input = path.join(__dirname, '../Website/assets/img/zooomit/shopping-experience.jpg');
    const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // Replace background with transparent
    // Any pixel where r > 210, g > 210, b > 200, and it's not the milk label or milk bottle
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isMilkBottle = (x >= 490 && x <= 610 && y >= 250 && y <= 485);
            const isBagSurface = (x >= 320 && x <= 680 && y >= 475 && y <= 850);
            const isBottomTable = (y >= 845);

            if (isBottomTable) {
                data[idx + 3] = 0;
            } else if (!isMilkBottle && !isBagSurface) {
                // Background wall / rectangle
                if (r > 210 && g > 200 && b > 190 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
                    data[idx + 3] = 0;
                }
            }
        }
    }

    const cleanedBagBuffer = await sharp(data, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer();

    // Now resize phone and bag
    const phone = await sharp(path.join(__dirname, '../Website/assets/img/th-3/home-banner.png'))
        .resize({ height: 580, fit: 'contain' })
        .toBuffer();
    
    const phoneMeta = await sharp(phone).metadata();

    const bag = await sharp(cleanedBagBuffer)
        .resize({ height: 490, fit: 'contain' })
        .toBuffer();
    
    const bagMeta = await sharp(bag).metadata();

    const canvasWidth = phoneMeta.width + bagMeta.width - 240;
    const canvasHeight = 600;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        {
            input: bag,
            top: canvasHeight - bagMeta.height - 10,
            left: phoneMeta.width - 200
        },
        {
            input: phone,
            top: canvasHeight - phoneMeta.height,
            left: 0
        }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-app-showcase.png'));

    console.log('Cleaned and regenerated footer-app-showcase.png');
}

cleanBag().catch(console.error);
