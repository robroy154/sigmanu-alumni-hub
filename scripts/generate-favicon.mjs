import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const pngBuffer = await sharp(join(root, "public/favicon.svg"))
  .resize(32, 32)
  .png()
  .toBuffer();

const icoBuffer = await toIco([pngBuffer]);
writeFileSync(join(root, "public/favicon.ico"), icoBuffer);

console.log("public/favicon.ico written (%d bytes)", icoBuffer.length);
