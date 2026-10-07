/**
 * Generates SAMPLE placeholder artwork (SVG t-shirt mock-ups) so the store looks complete in development.
 * - backend/uploads/placeholders/*.svg   -> sample product / category images (URL: /uploads/placeholders/..)
 * - frontend/public/placeholders/*.svg   -> hero / gallery art used by the storefront
 * Replace these with real photography: upload through Admin > Products, and swap files in
 * frontend/public/placeholders for the hero/gallery.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PRODUCTS = path.resolve(__dirname, '..', 'uploads', 'placeholders');
const OUT_FRONT = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'placeholders');
fs.mkdirSync(OUT_PRODUCTS, { recursive: true });
fs.mkdirSync(OUT_FRONT, { recursive: true });

const GOLD = '#D2A24E';

const TEE = {
  regular: 'M300 120 C340 150 460 150 500 120 L640 175 L720 330 L625 370 L600 300 L600 840 L200 840 L200 300 L175 370 L80 330 L160 175 Z',
  oversized: 'M300 125 C340 155 460 155 500 125 L670 190 L770 420 L650 450 L610 340 L610 860 L190 860 L190 340 L150 450 L30 420 L130 190 Z',
};
const NECK = 'M300 120 C340 175 460 175 500 120 C470 138 330 138 300 120 Z';

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

function graphic(kind, ink, back) {
  if (back) {
    return `<g fill="none" stroke="${ink}" stroke-width="3" opacity=".95"><text x="400" y="330" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="${ink}" stroke="none" letter-spacing="10">CHOLAN</text><line x1="290" y1="352" x2="510" y2="352"/><text x="400" y="392" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="${ink}" stroke="none" letter-spacing="14">WEAR</text></g>`;
  }
  switch (kind) {
    case 'lion':
      return `<g fill="${ink}"><path d="M400 330 C350 330 330 380 345 420 C330 440 345 470 370 475 C385 500 415 500 430 475 C455 470 470 440 455 420 C470 380 450 330 400 330Z" opacity=".95"/><circle cx="385" cy="405" r="6" fill="${back ? '#000' : '#00000055'}"/><circle cx="415" cy="405" r="6" fill="#00000055"/></g><text x="400" y="560" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${ink}" letter-spacing="9">CHOLAN</text>`;
    case 'bold':
      return `<text x="400" y="420" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="96" fill="${ink}" letter-spacing="4">WEAR</text><text x="400" y="480" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="${ink}" letter-spacing="16">YOUR IDENTITY</text>`;
    case 'geo':
      return `<g fill="none" stroke="${ink}" stroke-width="5"><circle cx="400" cy="430" r="90"/><circle cx="400" cy="430" r="60"/><path d="M400 330 L400 530 M300 430 L500 430"/></g><text x="400" y="590" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="${ink}" letter-spacing="12">CHOLAN WEAR</text>`;
    case 'crown':
      return `<g fill="${ink}"><path d="M330 440 L350 370 L385 415 L400 360 L415 415 L450 370 L470 440 Z"/><rect x="330" y="448" width="140" height="14"/></g><text x="400" y="520" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="${ink}" letter-spacing="10">ROYAL</text>`;
    case 'custom':
      return `<g fill="none" stroke="${ink}" stroke-width="4" stroke-dasharray="14 10"><rect x="290" y="330" width="220" height="220" rx="6"/></g><text x="400" y="425" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${ink}" letter-spacing="6">YOUR</text><text x="400" y="470" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${ink}" letter-spacing="6">DESIGN</text><text x="400" y="515" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="${ink}" letter-spacing="6">HERE</text>`;
    default:
      return `<text x="400" y="360" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="${ink}" letter-spacing="9">CHOLAN WEAR</text>`;
  }
}

function teeSvg({ fit = 'regular', color, ink, kind, back = false, bg = '#F2F1EE' }) {
  const body = TEE[fit];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 14)}"/><stop offset="1" stop-color="${shade(color, -18)}"/></linearGradient>
<radialGradient id="f" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${shade(bg, 8)}"/><stop offset="1" stop-color="${shade(bg, -14)}"/></radialGradient></defs>
<rect width="800" height="1000" fill="url(#f)"/>
<ellipse cx="400" cy="930" rx="260" ry="22" fill="#00000018"/>
<path d="${body}" fill="url(#g)" stroke="${shade(color, -40)}" stroke-width="2" stroke-linejoin="round"/>
<path d="${NECK}" fill="${shade(color, back ? -30 : -45)}" opacity="${back ? '.5' : '.9'}"/>
<path d="M300 120 C340 150 460 150 500 120" fill="none" stroke="${shade(color, -55)}" stroke-width="5" stroke-linecap="round"/>
${graphic(kind, ink, back)}
</svg>`;
}

const write = (dir, name, svg) => fs.writeFileSync(path.join(dir, `${name}.svg`), svg);

// Product art: [file, options]
const colors = {
  black: ['#111111', GOLD],
  white: ['#F7F7F5', '#111111'],
  charcoal: ['#3A3A3C', '#FFFFFF'],
  sand: ['#CBBFA8', '#111111'],
  maroon: ['#5A1A24', GOLD],
};
const designs = ['lion', 'bold', 'geo', 'crown', 'custom', 'plain'];
const names = [];
for (const fit of ['regular', 'oversized']) {
  for (const [cname, [fill, ink]] of Object.entries(colors)) {
    for (const kind of designs) {
      const base = `${fit}-${cname}-${kind}`;
      write(OUT_PRODUCTS, `${base}-front`, teeSvg({ fit, color: fill, ink, kind }));
      write(OUT_PRODUCTS, `${base}-back`, teeSvg({ fit, color: fill, ink, kind, back: true }));
      names.push(base);
    }
  }
}

// Category covers
write(OUT_PRODUCTS, 'category-oversized', teeSvg({ fit: 'oversized', color: '#111111', ink: GOLD, kind: 'lion', bg: '#E9E7E2' }));
write(OUT_PRODUCTS, 'category-regular', teeSvg({ fit: 'regular', color: '#F7F7F5', ink: '#111111', kind: 'bold', bg: '#E9E7E2' }));
write(OUT_PRODUCTS, 'category-custom', teeSvg({ fit: 'regular', color: '#3A3A3C', ink: '#FFFFFF', kind: 'custom', bg: '#E9E7E2' }));

// Storefront hero + gallery
write(OUT_FRONT, 'hero-tee', teeSvg({ fit: 'oversized', color: '#111111', ink: GOLD, kind: 'lion', bg: '#1b1b1b' }));
write(OUT_FRONT, 'hero-tee-2', teeSvg({ fit: 'oversized', color: '#F7F7F5', ink: '#111111', kind: 'crown', bg: '#1b1b1b' }));
write(OUT_FRONT, 'banner-tee', teeSvg({ fit: 'regular', color: '#111111', ink: GOLD, kind: 'bold', bg: '#161616' }));
[
  ['oversized-black-lion', 'lion', 'oversized', '#111111', GOLD],
  ['regular-white-bold', 'bold', 'regular', '#F7F7F5', '#111111'],
  ['oversized-sand-geo', 'geo', 'oversized', '#CBBFA8', '#111111'],
  ['regular-charcoal-custom', 'custom', 'regular', '#3A3A3C', '#FFFFFF'],
  ['oversized-maroon-crown', 'crown', 'oversized', '#5A1A24', GOLD],
  ['regular-black-plain', 'plain', 'regular', '#111111', GOLD],
].forEach(([n, kind, fit, c, ink], i) => write(OUT_FRONT, `gallery-${i + 1}`, teeSvg({ fit, color: c, ink, kind, bg: i % 2 ? '#E9E7E2' : '#F2F1EE' })));

console.log(`Generated ${names.length * 2} product placeholders + category/hero/gallery art.`);
