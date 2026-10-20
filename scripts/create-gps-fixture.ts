/**
 * Creates tests/fixtures/gps.jpg — a minimal JPEG with GPS EXIF embedded.
 * Run once: pnpm tsx scripts/create-gps-fixture.ts
 * The file is committed so tests don't need to regenerate it.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const piexif = require('piexifjs') as typeof import('piexifjs');

async function main() {
  const outPath = path.resolve('tests/fixtures/gps.jpg');

  // 1. Create a tiny 40×40 white JPEG with sharp
  const pixels = Buffer.alloc(40 * 40 * 3, 255); // white
  const jpegBuffer = await sharp(pixels, { raw: { width: 40, height: 40, channels: 3 } })
    .jpeg({ quality: 80 })
    .toBuffer();

  // 2. Embed GPS + Make/Model EXIF using piexifjs
  const jpegString = jpegBuffer.toString('binary');

  const exifObj = {
    '0th': {
      [piexif.ImageIFD.Make]: 'TestMake',
      [piexif.ImageIFD.Model]: 'TestModel',
    },
    GPS: {
      [piexif.GPSIFD.GPSLatitudeRef]: 'N',
      [piexif.GPSIFD.GPSLatitude]: [[23, 1], [21, 1], [0, 1]],
      [piexif.GPSIFD.GPSLongitudeRef]: 'E',
      [piexif.GPSIFD.GPSLongitude]: [[85, 1], [18, 1], [0, 1]],
    },
    Exif: {},
  };

  const exifBytes = piexif.dump(exifObj);
  const withExif = piexif.insert(exifBytes, jpegString);
  const result = Buffer.from(withExif, 'binary');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, result);
  console.log(`Created ${outPath} (${result.length} bytes)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
