// Script to convert SVG icons to PNG for PWA
import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const publicDir = './client/public';

async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted ${svgPath} to ${pngPath} (${size}x${size})`);
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error);
  }
}

async function main() {
  // Create public directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Convert icon-192.svg to icon-192.png
  await convertSvgToPng(
    path.join(publicDir, 'icon-192.svg'),
    path.join(publicDir, 'icon-192.png'),
    192
  );

  // Convert icon-512.svg to icon-512.png
  await convertSvgToPng(
    path.join(publicDir, 'icon-512.svg'),
    path.join(publicDir, 'icon-512.png'),
    512
  );

  console.log('Icon conversion complete!');
}

main().catch(console.error);