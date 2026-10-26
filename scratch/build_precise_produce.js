const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));

async function buildPreciseProduce() {
    const src = path.join(__dirname, '../Website/assets/img/th-3/newsletter-image.png');

    // 1. Crisp green lettuce & carrot from top-left (x: 10 to 220, y: 180 to 440)
    const greens = await sharp(src)
        .extract({ left: 10, top: 180, width: 210, height: 260 })
        .resize({ height: 180 })
        .toBuffer();

    // 2. Yellow bell pepper + parsley (x: 660 to 845, y: 810 to 1170)
    const pepper = await sharp(src)
        .extract({ left: 660, top: 810, width: 185, height: 350 })
        .resize({ height: 180 })
        .toBuffer();

    // 3. Red tomato + basil leaves (x: 170 to 370, y: 890 to 1170)
    const tomato = await sharp(src)
        .extract({ left: 170, top: 890, width: 200, height: 280 })
        .resize({ height: 150 })
        .toBuffer();

    const canvasWidth = 420;
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
        { input: greens, left: 0, top: 10 },
        { input: pepper, left: 130, top: 5 },
        { input: tomato, left: 230, top: 35 }
    ])
    .png()
    .toFile(path.join(__dirname, '../Website/assets/img/zooomit/footer-produce-left.png'));

    console.log('Saved precise footer-produce-left.png');
}

buildPreciseProduce().catch(console.error);
