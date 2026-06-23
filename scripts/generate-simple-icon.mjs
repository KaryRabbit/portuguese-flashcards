import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
if (!out) {
  throw new Error('Usage: node scripts/generate-simple-icon.mjs <output.png>');
}

const scale = 3;
const size = 1024;
const w = size * scale;
const h = size * scale;
const pixels = new Uint8ClampedArray(w * h * 4);

const colors = {
  bgTop: [246, 250, 248, 255],
  bgBottom: [218, 236, 229, 255],
  navy: [15, 23, 42, 255],
  navySoft: [30, 41, 59, 255],
  card: [255, 255, 255, 255],
  card2: [242, 248, 246, 255],
  green: [0, 102, 51, 255],
  red: [218, 41, 28, 255],
  line: [203, 213, 225, 255],
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const idx = (y * w + x) * 4;
  const a = color[3] / 255;
  const ia = 1 - a;
  pixels[idx] = Math.round(color[0] * a + pixels[idx] * ia);
  pixels[idx + 1] = Math.round(color[1] * a + pixels[idx + 1] * ia);
  pixels[idx + 2] = Math.round(color[2] * a + pixels[idx + 2] * ia);
  pixels[idx + 3] = 255;
}

function rect(x, y, rw, rh, color) {
  x *= scale; y *= scale; rw *= scale; rh *= scale;
  for (let py = y; py < y + rh; py++) {
    for (let px = x; px < x + rw; px++) setPixel(px, py, color);
  }
}

function roundedRect(x, y, rw, rh, r, color) {
  x *= scale; y *= scale; rw *= scale; rh *= scale; r *= scale;
  const x2 = x + rw - 1;
  const y2 = y + rh - 1;
  for (let py = y; py <= y2; py++) {
    for (let px = x; px <= x2; px++) {
      const cx = px < x + r ? x + r : px > x2 - r ? x2 - r : px;
      const cy = py < y + r ? y + r : py > y2 - r ? y2 - r : py;
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(px, py, color);
    }
  }
}

function circle(cx, cy, r, color) {
  cx *= scale; cy *= scale; r *= scale;
  const rr = r * r;
  for (let py = cy - r; py <= cy + r; py++) {
    for (let px = cx - r; px <= cx + r; px++) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= rr) setPixel(px, py, color);
    }
  }
}

function strokeLine(x1, y1, x2, y2, width, color) {
  x1 *= scale; y1 *= scale; x2 *= scale; y2 *= scale; width *= scale;
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
      const nx = x1 + t * dx;
      const ny = y1 + t * dy;
      const dist = Math.hypot(px - nx, py - ny);
      if (dist <= width / 2) setPixel(px, py, color);
    }
  }
}

function polygon(points, color) {
  const scaled = points.map(([x, y]) => [x * scale, y * scale]);
  const minX = Math.floor(Math.min(...scaled.map(([x]) => x)));
  const maxX = Math.ceil(Math.max(...scaled.map(([x]) => x)));
  const minY = Math.floor(Math.min(...scaled.map(([, y]) => y)));
  const maxY = Math.ceil(Math.max(...scaled.map(([, y]) => y)));
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      let inside = false;
      for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
        const [xi, yi] = scaled[i];
        const [xj, yj] = scaled[j];
        const intersects =
          yi > py !== yj > py &&
          px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
      }
      if (inside) setPixel(px, py, color);
    }
  }
}

function arc(cx, cy, r, start, end, width, color) {
  cx *= scale; cy *= scale; r *= scale; width *= scale;
  const minX = Math.floor(cx - r - width);
  const maxX = Math.ceil(cx + r + width);
  const minY = Math.floor(cy - r - width);
  const maxY = Math.ceil(cy + r + width);
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const angle = Math.atan2(py - cy, px - cx);
      const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
      const dist = Math.abs(Math.hypot(px - cx, py - cy) - r);
      const inRange =
        start <= end
          ? normalized >= start && normalized <= end
          : normalized >= start || normalized <= end;
      if (inRange && dist <= width / 2) {
        setPixel(px, py, color);
      }
    }
  }
}

for (let y = 0; y < h; y++) {
  const t = y / (h - 1);
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    pixels[idx] = Math.round(colors.bgTop[0] * (1 - t) + colors.bgBottom[0] * t);
    pixels[idx + 1] = Math.round(colors.bgTop[1] * (1 - t) + colors.bgBottom[1] * t);
    pixels[idx + 2] = Math.round(colors.bgTop[2] * (1 - t) + colors.bgBottom[2] * t);
    pixels[idx + 3] = 255;
  }
}

roundedRect(188, 276, 612, 420, 58, colors.card2);
roundedRect(206, 206, 612, 420, 58, colors.card);

rect(206, 206, 56, 420, colors.green);
rect(262, 206, 42, 420, colors.red);
roundedRect(206, 206, 612, 420, 58, [255, 255, 255, 18]);

strokeLine(386, 330, 680, 330, 28, colors.navy);
strokeLine(386, 422, 602, 422, 22, colors.line);
strokeLine(386, 494, 696, 494, 22, colors.line);

circle(675, 414, 70, colors.navySoft);
roundedRect(626, 390, 24, 48, 8, colors.card);
polygon([[648, 391], [680, 363], [680, 465], [648, 437]], colors.card);
arc(683, 414, 42, Math.PI * 1.68, Math.PI * 0.32, 12, colors.card);
arc(683, 414, 70, Math.PI * 1.72, Math.PI * 0.28, 10, colors.card);

const small = new Uint8ClampedArray(size * size * 4);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const sum = [0, 0, 0, 0];
    for (let sy = 0; sy < scale; sy++) {
      for (let sx = 0; sx < scale; sx++) {
        const idx = ((y * scale + sy) * w + (x * scale + sx)) * 4;
        sum[0] += pixels[idx];
        sum[1] += pixels[idx + 1];
        sum[2] += pixels[idx + 2];
        sum[3] += pixels[idx + 3];
      }
    }
    const outIdx = (y * size + x) * 4;
    small[outIdx] = Math.round(sum[0] / (scale * scale));
    small[outIdx + 1] = Math.round(sum[1] / (scale * scale));
    small[outIdx + 2] = Math.round(sum[2] / (scale * scale));
    small[outIdx + 3] = Math.round(sum[3] / (scale * scale));
  }
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

const raw = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y++) {
  const row = y * (size * 4 + 1);
  raw[row] = 0;
  Buffer.from(small.buffer, y * size * 4, size * 4).copy(raw, row + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;

writeFileSync(out, Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]));
