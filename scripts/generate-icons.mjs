import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const te = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([te, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, te, data, crc]);
}

function encodePng(size, paint) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

function dist(x, y, cx, cy, sx, sy) {
  const dx = (x - cx) / sx;
  const dy = (y - cy) / sy;
  return Math.hypot(dx, dy);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function paintBee(x, y, size, { maskable }) {
  const p = size / 512;
  const cx = size / 2;
  const cy = size / 2 + 8 * p;
  const pad = maskable ? 80 * p : 28 * p;
  const bgR = size / 2 - 4;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);

  const paper = [247, 240, 228, 255];
  const honey = [227, 165, 26, 255];
  const ink = [28, 23, 16, 255];
  const wing = [255, 252, 246, 230];
  const blush = [232, 180, 150, 255];

  if (r > bgR) return [0, 0, 0, 0];

  // honey disc with paper inner
  let col = honey;
  if (r < bgR - pad * 0.15) col = paper;

  const body = dist(x, y, cx, cy + 18 * p, 78 * p, 108 * p);
  const head = dist(x, y, cx, cy - 92 * p, 58 * p, 54 * p);
  const wingL = dist(x, y, cx - 78 * p, cy - 10 * p, 70 * p, 46 * p);
  const wingR = dist(x, y, cx + 78 * p, cy - 10 * p, 70 * p, 46 * p);

  if (wingL < 1 || wingR < 1) col = wing;
  if (body < 1) {
    const ly = (y - (cy - 70 * p)) / (160 * p);
    const stripe = ly > 0.18 && ly < 0.86 && Math.floor(ly * 7) % 2 === 0;
    col = stripe ? ink : honey;
  }
  if (head < 1) col = ink;

  // cheeks
  if (dist(x, y, cx - 22 * p, cy - 88 * p, 10 * p, 7 * p) < 1) col = blush;
  if (dist(x, y, cx + 22 * p, cy - 88 * p, 10 * p, 7 * p) < 1) col = blush;

  // eyes
  if (dist(x, y, cx - 16 * p, cy - 98 * p, 7 * p, 8 * p) < 1) col = paper;
  if (dist(x, y, cx + 16 * p, cy - 98 * p, 7 * p, 8 * p) < 1) col = paper;
  if (dist(x, y, cx - 16 * p, cy - 98 * p, 3.2 * p, 3.4 * p) < 1) col = ink;
  if (dist(x, y, cx + 16 * p, cy - 98 * p, 3.2 * p, 3.4 * p) < 1) col = ink;

  // stinger
  const sx = Math.abs(dx);
  const sy = y - (cy + 118 * p);
  if (sy > 0 && sy < 28 * p && sx < lerp(18 * p, 2 * p, sy / (28 * p))) col = ink;

  // antennae
  const ant = (ax) => {
    const t = (y - (cy - 150 * p)) / (40 * p);
    if (t > 0 && t < 1) {
      const qx = cx + ax * (22 * p + t * 16 * p);
      if (Math.abs(x - qx) < 3.2 * p) return true;
    }
    return dist(x, y, cx + ax * 40 * p, cy - 152 * p, 6 * p, 6 * p) < 1;
  };
  if (ant(-1) || ant(1)) col = ink;

  return col;
}

mkdirSync(join(root, "public/icons"), { recursive: true });
writeFileSync(
  join(root, "public/icons/icon-192.png"),
  encodePng(192, (x, y, s) => paintBee(x, y, s, { maskable: false })),
);
writeFileSync(
  join(root, "public/icons/icon-512.png"),
  encodePng(512, (x, y, s) => paintBee(x, y, s, { maskable: false })),
);
writeFileSync(
  join(root, "public/icons/icon-512-maskable.png"),
  encodePng(512, (x, y, s) => paintBee(x, y, s, { maskable: true })),
);
writeFileSync(
  join(root, "public/apple-touch-icon.png"),
  encodePng(180, (x, y, s) => paintBee(x, y, s, { maskable: false })),
);
console.log("icons written");
