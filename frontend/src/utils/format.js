import { API_ORIGIN } from '../services/api';

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const formatDate = (d, withTime = false) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

/** Stored image URLs are relative (/uploads/..). Prefix the API origin when API is on another host. */
export const assetUrl = (url) => {
  if (!url) return '/placeholders/hero-tee.svg';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return url.startsWith('/uploads') ? `${API_ORIGIN}${url}` : url;
};

export const discountPercent = (selling, original) =>
  original > selling && original > 0 ? Math.round(((original - selling) / original) * 100) : 0;

export const slugify = (t = '') =>
  t.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const MAX_QTY_PER_LINE = 10;
