const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function buildCleanProduce() {
    const src = path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png');

    // 1. Crisp green lettuce & carrot from top-left (x: 10 to 220, y: 180 to 440)
    // The lettuce is completely in front of the brown paper bag. Let's make the brown paper bag (x > 140, y > 200) transparent!
    const { data: gData, info: gInfo } = await sharp(src)
        .extract({ left: 10, top: 180, width: 220, height: 260 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < gInfo.height; y++) {
        for (let x = 0; x < gInfo.width; x++) {
            const idx = (y * gInfo.width + x) * 4;
            const r = gData[idx];
            const g = gData[idx + 1];
            const b = gData[idx + 2];
            // Brown bag color is r: 160-210, g: 120-170, b: 80-130
            if (x > 110 && y > 120 && r > 140 && g > 110 && b < 140 && (r - b) > 40 && (g - b) > 20 && r > g) {
                // Brown bag paper
                gData[idx + 3] = 0;
            }
        }
    }

    const cleanGreens = await sharp(gData, { raw: gInfo }).png().resize({ height: 190 }).toBuffer();

    // 2. Yellow pepper + broccoli
    const { data: pData, info: pInfo } = await sharp(src)
        .extract({ left: 660, top: 810, width: 190, height: 350 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < pInfo.height; y++) {
        for (let x = 0; x < pInfo.width; x++) {
            const idx = (y * pInfo.width + x) * 4;
            const r = pData[idx];
            const g = pData[idx + 1];
            const b = pData[idx + 2];
            // Phone screen or border at top-left:
            if (x < 70 && y < 140) {
                // If it's not green broccoli (broccoli has r < 80, g < 130)
                if (r > 150 && g > 150) {
                    pData[idx + 3] = 0;
                } else if (r < 50 && g < 50 && b < 50) {
                    // dark phone bezel
                    pData[idx + 3] = 0;
                }
            }
        }
    }

    const cleanPepper = await sharp(pData, { raw: pInfo }).png().resize({ height: 190 }).toBuffer();

    // 3. Red tomato + basil leaves
    const { data: tData, info: tInfo } = await sharp(src)
        .extract({ left: 180, top: 890, width: 190, height: 280 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < tInfo.height; y++) {
        for (let x = 0; x < tInfo.width; x++) {
            const idx = (y * tInfo.width + x) * 4;
            const r = tData[idx];
            const g = tData[idx + 1];
            const b = tData[idx + 2];
            // Bananas on top-left (y < 90), phone on top-right (x > 110, y < 100)
            if (y < 90 && (r > 200 && g > 180)) {
                // Banana yellow or phone screen
                tData[idx + 3] = 0;
            } else if (x > 115 && y < 140 && (r < 50 || (r > 200 && g > 200))) {
                // phone screen/bezel
                tData[idx + 3] = 0;
            }
        }
    }

    const cleanTomato = await sharp(tData, { raw: tInfo }).png().resize({ height: 160 }).toBuffer();

    const canvasWidth = 420;
    const canvasHeight = 200;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: cleanGreens, left: 0, top: 10 },
        { input: cleanPepper, left: 110, top: 10 },
        { input: cleanTomato, left: 220, top: 35 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Saved clean produce left');
}

buildCleanProduce().catch(console.error);
