import env from '../../config/env.js';
import localDriver from './localStorage.js';
import cloudinaryDriver from './cloudinaryStorage.js';

// local = disk (dev / a server with a persistent disk). cloudinary = hosts without one (Vercel).
// To add S3: create ./s3Storage.js exporting { save, remove } returning absolute https URLs and register it here.
const drivers = {
  local: localDriver,
  cloudinary: cloudinaryDriver,
};

const storage = drivers[env.storageDriver];
if (!storage) throw new Error(`Unknown STORAGE_DRIVER "${env.storageDriver}"`);

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/** Verify the real file type from magic bytes - the client-declared mimetype is not trusted. */
export function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export async function saveImage(file, folder) {
  const type = detectImageType(file.buffer);
  if (!type) {
    const err = new Error(`"${file.originalname}" is not a valid JPG, PNG or WEBP image.`);
    err.status = 400;
    throw err;
  }
  return storage.save({ buffer: file.buffer, ext: EXT_BY_MIME[type], folder });
}

export const removeImage = (url) => storage.remove(url);
export const removeImages = (urls = []) => Promise.all(urls.map((u) => storage.remove(u)));

export default storage;
