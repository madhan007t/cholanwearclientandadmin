/**
 * One-off: move images stored on this machine (backend/uploads/...) to Cloudinary and point the
 * products / categories in MongoDB at the new URLs. Safe to re-run - already-moved images are skipped.
 *   Set CLOUDINARY_* in .env, then:  npm run migrate:images
 */
import fs from 'fs/promises';
import path from 'path';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import cloudinary from '../services/storage/cloudinaryStorage.js';

const moved = new Map(); // old url -> new url (an image can be referenced more than once)
let missing = 0;

async function migrate(url) {
  if (!url || !url.startsWith('/uploads/')) return url; // already remote, or empty
  if (moved.has(url)) return moved.get(url);
  const rel = url.slice('/uploads/'.length);
  let buffer;
  try {
    buffer = await fs.readFile(path.join(env.uploadDir, rel));
  } catch {
    missing += 1;
    console.warn('  missing on disk, left unchanged:', url);
    return url;
  }
  const { url: next } = await cloudinary.save({ buffer, ext: path.extname(rel), folder: path.dirname(rel).split(path.sep).join('/') });
  moved.set(url, next);
  console.log('  uploaded', url);
  return next;
}

await connectDB();

for (const p of await Product.find()) {
  const images = [];
  for (const u of p.images) images.push(await migrate(u));
  const primaryImage = await migrate(p.primaryImage);
  if (primaryImage !== p.primaryImage || images.some((u, i) => u !== p.images[i])) {
    await Product.updateOne({ _id: p._id }, { $set: { images, primaryImage } });
    console.log('updated product:', p.name);
  }
}

for (const c of await Category.find()) {
  const image = await migrate(c.image);
  if (image !== c.image) {
    await Category.updateOne({ _id: c._id }, { $set: { image } });
    console.log('updated category:', c.name);
  }
}

console.log(`\nDone. ${moved.size} image(s) moved, ${missing} missing on disk.`);
await disconnectDB();
