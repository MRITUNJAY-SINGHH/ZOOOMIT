const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function buildSeamlessProduce() {
    const src = path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png');

    // 1. Fresh greens & carrots
    const greens = await sharp(src)
        .extract({ left: 10, top: 200, width: 135, height: 210 })
        .resize({ height: 165 })
        .toBuffer();

    // 2. Yellow bell pepper + broccoli
    const { data: pData, info: pInfo } = await sharp(src)
        .extract({ left: 690, top: 920, width: 165, height: 240 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Feather left edge of pepper
    for (let y = 0; y < pInfo.height; y++) {
        for (let x = 0; x < 25; x++) {
            const idx = (y * pInfo.width + x) * 4;
            pData[idx + 3] = Math.round(pData[idx + 3] * Math.sin((x / 25) * Math.PI / 2));
        }
    }

    const pepper = await sharp(pData, { raw: pInfo })
        .png()
        .resize({ height: 165 })
        .toBuffer();

    // 3. Ripe red tomato + basil
    const { data: tData, info: tInfo } = await sharp(src)
        .extract({ left: 210, top: 960, width: 140, height: 200 })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Feather left edge of tomato
    for (let y = 0; y < tInfo.height; y++) {
        for (let x = 0; x < 25; x++) {
            const idx = (y * tInfo.width + x) * 4;
            tData[idx + 3] = Math.round(tData[idx + 3] * Math.sin((x / 25) * Math.PI / 2));
        }
    }

    const tomato = await sharp(tData, { raw: tInfo })
        .png()
        .resize({ height: 140 })
        .toBuffer();

    const canvasWidth = 330;
    const canvasHeight = 175;

    await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([
        { input: greens, left: 0, top: 5 },
        { input: pepper, left: 60, top: 5 },
        { input: tomato, left: 165, top: 30 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Saved seamless organic produce cluster');
}

buildSeamlessProduce().catch(console.error);
