import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to generate a simple RGBA PNG buffer using node:zlib
function createPng(width, height, getPixel) {
  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  // Raw image data with 1 byte filter per line (0 = None)
  const rawData = Buffer.alloc(height * (1 + rowBytes));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Standard CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

function renderIcon(x, y, w, h) {
  // Normalize
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Rounded squircle app icon
  const rCorner = 0.82;
  const isInside = Math.abs(nx) < rCorner && Math.abs(ny) < rCorner;
  // Corner smoothing
  const cornerDist = Math.hypot(
    Math.max(0, Math.abs(nx) - (rCorner - 0.2)),
    Math.max(0, Math.abs(ny) - (rCorner - 0.2))
  );

  if (cornerDist > 0.25) {
    return [0, 0, 0, 0];
  }

  // Background gradient: deep slate #0f172a to dark indigo #1e1b4b
  const t = (nx + ny + 2) / 4;
  let bgR = Math.round(15 + 15 * t);
  let bgG = Math.round(23 + 10 * t);
  let bgB = Math.round(42 + 40 * t);

  // Inner joint icon: stylized glowing joint node / pulse curve
  // Center glowing circle
  const dCenter = Math.hypot(nx, ny);
  if (dCenter < 0.28) {
    // Pulse center glow - amber/coral to cyan
    const glow = 1 - dCenter / 0.28;
    const gR = Math.round(245 * glow + bgR * (1 - glow));
    const gG = Math.round(158 * glow + bgG * (1 - glow));
    const gB = Math.round(11 * glow + bgB * (1 - glow));
    return [gR, gG, gB, 255];
  }

  // Wave line: y = 0.25 * sin(x * 3.5)
  const waveY = -0.15 * Math.sin(nx * 4.2);
  const dWave = Math.abs(ny - waveY);
  if (dWave < 0.08 && Math.abs(nx) < 0.65) {
    const waveGlow = 1 - dWave / 0.08;
    const wR = Math.round(251 * waveGlow + bgR * (1 - waveGlow));
    const wG = Math.round(146 * waveGlow + bgG * (1 - waveGlow));
    const wB = Math.round(60 * waveGlow + bgB * (1 - waveGlow));
    return [wR, wG, wB, 255];
  }

  // Ring around joint
  const ringDist = Math.abs(dCenter - 0.42);
  if (ringDist < 0.05) {
    const ringGlow = 1 - ringDist / 0.05;
    const rR = Math.round(56 * ringGlow + bgR * (1 - ringGlow));
    const rG = Math.round(189 * ringGlow + bgG * (1 - ringGlow));
    const rB = Math.round(248 * ringGlow + bgB * (1 - ringGlow));
    return [rR, rG, rB, 255];
  }

  return [bgR, bgG, bgB, 255];
}

console.log('Generating PWA icons...');
const png192 = createPng(192, 192, renderIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPng(512, 512, renderIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const appleIcon = createPng(180, 180, renderIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// SVG Favicon
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#grad)" />
  <circle cx="50" cy="50" r="22" stroke="url(#glow)" stroke-width="4" fill="none" opacity="0.6"/>
  <circle cx="50" cy="50" r="14" fill="#f59e0b"/>
  <path d="M 15 50 Q 32.5 30 50 50 T 85 50" fill="none" stroke="#fb923c" stroke-width="5" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="7" fill="#ffffff"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon);
console.log('Icons generated successfully!');
