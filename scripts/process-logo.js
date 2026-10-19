import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

// Copy splash screen and banner directly
fs.copyFileSync(
  path.join(rootDir, 'Gemini_Generated_Image_3stuna3stuna3stu.jpeg'),
  path.join(publicDir, 'splash-screen.jpg')
);

fs.copyFileSync(
  path.join(rootDir, 'Gemini_Generated_Image_fecyqsfecyqsfecy.jpeg'),
  path.join(publicDir, 'homescreen-banner.jpg')
);

fs.copyFileSync(
  path.join(rootDir, 'Gemini_Generated_Image_45o4zo45o4zo45o4.jpeg'),
  path.join(publicDir, 'brand-light.jpg')
);

console.log('Copied splash-screen.jpg, homescreen-banner.jpg, and brand-light.jpg!');
