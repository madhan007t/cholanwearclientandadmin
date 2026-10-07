import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import env from '../../config/env.js';

const URL_PREFIX = '/uploads/';

/**
 * Local-disk storage driver. Every driver exposes the same two methods:
 *   save({ buffer, ext, folder }) -> { url }
 *   remove(url)                   -> void
 * Swap in Cloudinary/S3 by adding another driver with this contract (see storage/index.js).
 */
const localDriver = {
  name: 'local',

  async save({ buffer, ext, folder = 'products' }) {
    const dir = path.join(env.uploadDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);
    return { url: `${URL_PREFIX}${folder}/${filename}` };
  },

  async remove(url) {
    // Only ever delete files inside the upload dir, and never the bundled placeholder samples.
    if (!url || !url.startsWith(URL_PREFIX) || url.startsWith(`${URL_PREFIX}placeholders/`)) return;
    const target = path.resolve(env.uploadDir, url.slice(URL_PREFIX.length));
    if (!target.startsWith(env.uploadDir + path.sep)) return;
    await fs.unlink(target).catch(() => {});
  },
};

export default localDriver;
