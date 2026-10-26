const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function perfectProduceLeft() {
    const src = path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png');

    // In newsletter-image.png (859 x 1188):
    // Yellow pepper: x: 670 to 830, y: 830 to 1100
    // Broccoli: x: 680 to 840, y: 770 to 900
    // Parsley: x: 800 to 855, y: 920 to 1120
    const pepperSnippet = await sharp(src)
        .extract({ left: 665, top: 760, width: 190, height: 380 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Remove any phone pixel on the left (x < 30)
    for (let y = 0; y < pepperSnippet.info.height; y++) {
        for (let x = 0; x < pepperSnippet.info.width; x++) {
            const idx = (y * pepperSnippet.info.width + x) * 4;
            const r = pepperSnippet.data[idx];
            const g = pepperSnippet.data[idx + 1];
            const b = pepperSnippet.data[idx + 2];
            // Black phone edge or white map
            if (x < 35 && (r < 60 && g < 60 && b < 60 || r > 200 && g > 200)) {
                pepperSnippet.data[idx + 3] = 0;
            }
        }
    }

    const cleanPepper = await sharp(pepperSnippet.data, { raw: pepperSnippet.info })
        .png()
        .resize({ height: 180 })
        .toBuffer();

    // Red tomato: x: 195 to 370, y: 930 to 1170
    const tomatoSnippet = await sharp(src)
        .extract({ left: 195, top: 930, width: 175, height: 240 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < tomatoSnippet.info.height; y++) {
        for (let x = 0; x < tomatoSnippet.info.width; x++) {
            const idx = (y * tomatoSnippet.info.width + x) * 4;
            const r = tomatoSnippet.data[idx];
            const g = tomatoSnippet.data[idx + 1];
            const b = tomatoSnippet.data[idx + 2];
            // Cut phone edge on the right
            if (x > 140 && (r < 60 || (r > 200 && g > 200))) {
                tomatoSnippet.data[idx + 3] = 0;
            }
        }
    }

    const cleanTomato = await sharp(tomatoSnippet.data, { raw: tomatoSnippet.info })
        .png()
        .resize({ height: 155 })
        .toBuffer();

    // Greens/lettuce from top-left: x: 15 to 220, y: 190 to 420
    const greensSnippet = await sharp(src)
        .extract({ left: 15, top: 190, width: 200, height: 230 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < greensSnippet.info.height; y++) {
        for (let x = 0; x < greensSnippet.info.width; x++) {
            const idx = (y * greensSnippet.info.width + x) * 4;
            const r = greensSnippet.data[idx];
            const g = greensSnippet.data[idx + 1];
            const b = greensSnippet.data[idx + 2];
            // Remove brown bag on right/bottom
            if (x > 90 && y > 100 && r > 130 && g > 95 && b < 130 && r > g && g > b) {
                greensSnippet.data[idx + 3] = 0;
            }
        }
    }

    const cleanGreens = await sharp(greensSnippet.data, { raw: greensSnippet.info })
        .png()
        .resize({ height: 185 })
        .toBuffer();

    const canvasWidth = 440;
    const canvasHeight = 190;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: cleanGreens, left: 0, top: 5 },
        { input: cleanPepper, left: 120, top: 5 },
        { input: cleanTomato, left: 240, top: 35 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Saved perfected footer-produce-left.png');
}

perfectProduceLeft().catch(console.error);
