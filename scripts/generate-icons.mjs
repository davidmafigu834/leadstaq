import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
  { size: 512, filename: 'icon-512-maskable.png', maskable: true },
  { size: 180, filename: 'apple-touch-icon.png' },
];

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const padding = maskable ? size * 0.1 : 0;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  const squareSize = size - padding * 2;
  const radius = squareSize * 0.22;

  ctx.beginPath();
  ctx.roundRect(padding, padding, squareSize, squareSize, radius);
  ctx.fillStyle = '#D4FF4F';
  ctx.fill();

  const fontSize = squareSize * 0.52;
  ctx.font = `bold ${fontSize}px serif`;
  ctx.fillStyle = '#0a0a0a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

mkdirSync(join(process.cwd(), 'public', 'icons'), { recursive: true });

for (const { size, filename, maskable } of sizes) {
  const buffer = generateIcon(size, maskable);
  const outputPath = join(process.cwd(), 'public', 'icons', filename);
  writeFileSync(outputPath, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

console.log('Done. Icons written to public/icons/');
