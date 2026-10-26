const path = require('path');
const sharp = require(path.join(__dirname, '../Website/node_modules/sharp'));
const fs = require('fs');

async function extractBag() {
    const input = path.join(__dirname, '../Website/assets/img/zooomit/shopping-experience.jpg');
    const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const brightness = (r + g + b) / 3;
            const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

            // Exclude the white milk bottle in the center! The milk bottle is around x: 500-650, y: 250-480
            // Only remove background pixels around the outer areas or high brightness with very low saturation
            const isCenterBag = (x > width * 0.25 && x < width * 0.75 && y > height * 0.28 && y < height * 0.88);
            
            if (!isCenterBag) {
                if (brightness > 220 && diff < 30) {
                    if (brightness > 235) {
                        data[idx + 3] = 0;
                    } else {
                        data[idx + 3] = Math.max(0, Math.min(255, Math.round((235 - brightness) / 15 * 255)));
                    }
                } else if (y > height * 0.88 && brightness > 210) {
                    data[idx + 3] = 0;
                }
            } else {
                // If it's near the top outer edges
                if (y < height * 0.4 && brightness > 238 && diff < 15) {
                    data[idx + 3] = 0;
                }
            }
        }
    }

    const outPath = path.join(__dirname, '../Website/assets/img/zooomit/extracted-bag.png');
    await sharp(data, { raw: { width, height, channels: 4 } })
        .png()
        .toFile(outPath);
    console.log('Saved extracted-bag.png');
}

extractBag().catch(console.error);
