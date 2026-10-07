/**
 * Storefront photography - the ONE place to swap in CHOLAN WEAR's own photos.
 * Drop your files into frontend/public/images/ (keep the names, or change the paths below).
 *
 * The current files are free-licence stock photos (Pexels) used as DEVELOPMENT PLACEHOLDERS.
 * Replace them with your own campaign photography before launch.
 *
 * Recommended sizes:  hero.desktop 2000x1200 (landscape, subject in the centre/right, space on the left)
 *                     hero.mobile   900x1300  (portrait crop of the same shoot)
 *                     story         1600x1000 landscape
 *                     category      1000x1250 portrait (4:5)
 * Keep each JPG under ~300 KB (export at 75-80% quality).
 */
export const siteImages = {
  // Home hero: used as an untouched CSS background (cover). `position` keeps the subject (on the right
  // of the frame) visible - "x% y%" for phones, tablets and desktop. Change these if you swap the photo.
  hero: {
    src: "/images/hero1.png",
    position: { mobile: "76% 0%", tablet: "72% 0%", desktop: "68% 0%" },
  },
  story: {
    src: "/images/story.png",
    alt: "Close-up editorial portrait for the CHOLAN WEAR brand story",
  },
  // Category cards are matched by category slug; any other category falls back to its own uploaded image.
  categories: {
    "oversized-t-shirts": "/images/cat-oversized.jpg",
    "regular-t-shirts": "/images/cat-regular.jpg",
    "customized-t-shirts": "/images/cat-custom.jpg",
  },
  gallery: ["/images/cat-oversized.jpg", "/images/look-6.jpg", "/images/cat-custom.jpg", "/images/story.png", "/images/cat-regular.jpg", "/images/hero-mobile.jpg"],
};
