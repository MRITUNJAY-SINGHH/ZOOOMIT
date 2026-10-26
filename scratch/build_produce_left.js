const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function buildProduceLeft() {
    // 1. From newsletter-image.png, extract the yellow bell pepper & broccoli & parsley (transparent PNG)
    const pepperBroccoli = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 630, top: 760, width: 229, height: 410 })
        .toBuffer();

    // 2. From newsletter-image.png, extract the red tomato & basil (transparent PNG)
    const tomato = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 200, top: 880, width: 230, height: 290 })
        .toBuffer();

    // 3. From newsletter-image.png, extract the crisp lettuce / greens from top-left of bag (x: 10, y: 200, w: 320, h: 250)
    const greens = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 10, top: 200, width: 330, height: 260 })
        .toBuffer();

    // 4. Also from newsletter-image.png, extract the carrots (x: 100, y: 290, w: 100, h: 140)
    const carrots = await sharp(path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png'))
        .extract({ left: 100, top: 290, width: 105, height: 140 })
        .toBuffer();

    // Let's composite these into a gorgeous wide bottom-left produce cluster (e.g. 520 x 260)
    const greensResized = await sharp(greens).resize({ width: 240 }).toBuffer();
    const pepperResized = await sharp(pepperBroccoli).resize({ height: 230 }).toBuffer();
    const tomatoResized = await sharp(tomato).resize({ height: 160 }).toBuffer();
    const carrotsResized = await sharp(carrots).resize({ height: 130 }).toBuffer();

    const canvasWidth = 540;
    const canvasHeight = 260;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        // Greens on the left background
        { input: greensResized, left: 0, top: 30 },
        // Carrots peeking out behind pepper
        { input: carrotsResized, left: 350, top: 120 },
        // Yellow pepper & broccoli in the middle
        { input: pepperResized, left: 120, top: 25 },
        // Red tomato in the foreground right
        { input: tomatoResized, left: 240, top: 95 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Created footer-produce-left.png');
}

buildProduceLeft().catch(console.error);
