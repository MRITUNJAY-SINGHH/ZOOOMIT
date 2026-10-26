const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function buildCleanProduceLeft() {
    // In newsletter-image.png:
    // Right side: yellow pepper + broccoli + parsley (x: 645 to 859, y: 760 to 1188)
    // Left of this snippet is the phone border at x < 650
    // So let's extract x: 660 to 859 (width 199), y: 765 to 1188 (height 420)
    const rightVeg = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 660, top: 765, width: 199, height: 420 })
        .toBuffer();

    // In newsletter-image.png, top-left has crisp lettuce greens (x: 10 to 240, y: 200 to 450)
    const topGreens = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 10, top: 200, width: 230, height: 250 })
        .toBuffer();

    // In newsletter-image.png, carrots at x: 100 to 200, y: 290 to 430
    const carrots = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 100, top: 290, width: 100, height: 140 })
        .toBuffer();

    // In newsletter-image.png, tomato at bottom (x: 200 to 400, y: 900 to 1170)
    // The phone is behind the tomato at y < 920. Let's extract x: 200 to 400, y: 920 to 1180
    const rawTomato = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 200, top: 920, width: 200, height: 260 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // In rawTomato, remove any remaining phone pixels on the right side (x > 150)
    for (let y = 0; y < rawTomato.info.height; y++) {
        for (let x = 0; x < rawTomato.info.width; x++) {
            const idx = (y * rawTomato.info.width + x) * 4;
            // Phone border is dark/grey on the right
            if (x > 155 && rawTomato.data[idx] < 60 && rawTomato.data[idx+1] < 60 && rawTomato.data[idx+2] < 60) {
                rawTomato.data[idx+3] = 0;
            }
        }
    }

    const cleanTomato = await sharp(rawTomato.data, { raw: rawTomato.info }).png().toBuffer();

    // Resize components
    const wGreens = await sharp(topGreens).resize({ height: 200 }).toBuffer();
    const wPepper = await sharp(rightVeg).resize({ height: 220 }).toBuffer();
    const wTomato = await sharp(cleanTomato).resize({ height: 160 }).toBuffer();
    const wCarrot = await sharp(carrots).resize({ height: 140 }).toBuffer();

    // Composite them into a harmonious produce cluster
    // Order: Greens at left back, Carrots, Broccoli & Yellow Pepper, Tomato in foreground
    const canvasWidth = 480;
    const canvasHeight = 230;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: wGreens, left: 0, top: 30 },
        { input: wCarrot, left: 160, top: 70 },
        { input: wPepper, left: 180, top: 10 },
        { input: wTomato, left: 290, top: 70 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Regenerated clean footer-produce-left.png');
}

buildCleanProduceLeft().catch(console.error);
