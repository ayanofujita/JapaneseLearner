// Script to build the PWA
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

async function buildPWA() {
  try {
    // Step 1: Convert SVG icons to PNG
    console.log('Converting SVG icons to PNG...');
    await execAsync('node scripts/convert-icons.js');

    // Step 2: Build frontend assets with Vite
    console.log('Building frontend assets...');
    await execAsync('npx vite build');

    console.log('PWA build completed successfully!');
  } catch (error) {
    console.error('Error building PWA:', error);
    process.exit(1);
  }
}

buildPWA();