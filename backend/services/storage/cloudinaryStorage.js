import crypto from 'crypto';
import env from '../../config/env.js';

const ROOT_FOLDER = 'cholanwear';
const api = (action) => `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/${action}`;

/** Cloudinary request signature: sha1 of the alphabetically sorted params followed by the API secret. */
export function sign(params, secret = env.cloudinary.apiSecret) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(toSign + secret).digest('hex');
}

async function call(action, params, file) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');

  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const body = new FormData();
  Object.entries(signed).forEach(([k, v]) => body.append(k, String(v)));
  body.append('api_key', apiKey);
  body.append('signature', sign(signed));
  if (file) body.append('file', file);

  const res = await fetch(api(action), { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Cloudinary ${action} failed: ${data.error?.message || res.status}`);
  return data;
}

/** https://res.cloudinary.com/<cloud>/image/upload/v123/cholanwear/products/abc.jpg -> cholanwear/products/abc */
export function publicIdFromUrl(url) {
  const m = /\/image\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url || '');
  return m ? m[1] : null;
}

/**
 * Cloudinary storage driver (same contract as the local driver). Needed on hosts without a
 * persistent disk, e.g. Vercel. Returns absolute https URLs, which the storefront uses as-is.
 */
const cloudinaryDriver = {
  name: 'cloudinary',

  async save({ buffer, folder = 'products' }) {
    const publicId = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const data = await call('upload', { folder: `${ROOT_FOLDER}/${folder}`, public_id: publicId }, new Blob([buffer]));
    return { url: data.secure_url };
  },

  async remove(url) {
    // Only ever delete images in this store's own Cloudinary folder (old /uploads/... URLs are ignored).
    if (!url || !url.includes(`res.cloudinary.com/${env.cloudinary.cloudName}/`)) return;
    const publicId = publicIdFromUrl(url);
    if (!publicId || !publicId.startsWith(`${ROOT_FOLDER}/`)) return;
    await call('destroy', { public_id: publicId }).catch(() => {});
  },
};

export default cloudinaryDriver;
