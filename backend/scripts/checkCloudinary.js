/**
 * Checks the CLOUDINARY_* values in .env against Cloudinary itself (no upload, nothing is changed).
 *   npm run check:cloudinary
 */
import env from '../config/env.js';

const { cloudName, apiKey, apiSecret } = env.cloudinary;
const missing = Object.entries({ CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.log('NOT SET in backend/.env:', missing.join(', '));
  process.exit(1);
}

console.log(`cloud name: ${cloudName}`);
console.log(`api key:    ${apiKey.slice(0, 4)}… (${apiKey.length} characters${/^\d+$/.test(apiKey) ? '' : ' - WARNING: a Cloudinary API key is digits only'})`);
console.log(`api secret: ${apiSecret.length} characters${/^\*+$/.test(apiSecret) ? ' - WARNING: this is the masked ***** value, not the real secret' : ''}`);

const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
  headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}` },
});
const data = await res.json().catch(() => ({}));
if (res.ok) {
  console.log('\nOK - Cloudinary accepted these credentials. Use exactly the same three values on Vercel.');
  process.exit(0);
}
console.log(`\nREJECTED (${res.status}): ${data.error?.message || 'unknown error'}`);
process.exit(1);
