import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { escapeRegex } from '../utils/helpers.js';

const SORTS = {
  newest: { createdAt: -1 },
  'price-asc': { sellingPrice: 1, createdAt: -1 },
  'price-desc': { sellingPrice: -1, createdAt: -1 },
  popular: { isTrending: -1, soldCount: -1, createdAt: -1 },
};

/** Build a Mongo filter from validated query params. `admin` includes inactive products. */
export async function buildFilter(q, { admin = false } = {}) {
  const filter = {};
  if (!admin) filter.isActive = true;

  if (q.category) {
    const cat = await Category.findOne({ slug: q.category, ...(admin ? {} : { isActive: true }) }).select('_id');
    filter.category = cat ? cat._id : null; // unknown category => no results
  }
  if (!admin && !q.category) {
    // Hide products whose category was deactivated
    const hidden = await Category.find({ isActive: false }).select('_id');
    if (hidden.length) filter.category = { $nin: hidden.map((c) => c._id) };
  }

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    const cats = await Category.find({ name: rx }).select('_id');
    filter.$or = [{ name: rx }, { shortDescription: rx }, { sku: rx }, ...(cats.length ? [{ category: { $in: cats.map((c) => c._id) } }] : [])];
  }
  if (q.size) filter.sizes = q.size;
  if (q.color) filter['colors.name'] = new RegExp(`^${escapeRegex(q.color)}$`, 'i');
  if (q.minPrice != null || q.maxPrice != null) {
    filter.sellingPrice = {};
    if (q.minPrice != null) filter.sellingPrice.$gte = q.minPrice;
    if (q.maxPrice != null) filter.sellingPrice.$lte = q.maxPrice;
  }
  if (q.flag === 'trending') filter.isTrending = true;
  if (q.flag === 'new') filter.isNewArrival = true;
  if (q.flag === 'bestseller') filter.isBestSeller = true;
  if (q.exclude) filter._id = { $ne: q.exclude };
  if (q.isActive !== undefined) filter.isActive = q.isActive;
  return filter;
}

export async function listProducts(q, opts = {}) {
  const filter = await buildFilter(q, opts);
  const skip = (q.page - 1) * q.limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(SORTS[q.sort] || SORTS.newest)
      .skip(skip)
      .limit(q.limit),
    Product.countDocuments(filter),
  ]);
  return { products, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) };
}
