import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Settings from '../models/Settings.js';
import env from '../config/env.js';
import { cookieOptions, signAdminToken } from '../middleware/index.js';
import { listProducts } from '../services/productService.js';
import { applyStatusChange } from '../services/orderService.js';
import { removeImage, removeImages, saveImage } from '../services/storage/index.js';
import { ApiError, asyncHandler, escapeRegex, slugify } from '../utils/helpers.js';

const publicAdmin = (a) => ({ id: a._id, name: a.name, email: a.email, role: a.role });

/* ================= auth ================= */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password - no account enumeration.
  const ok = admin && (await admin.comparePassword(password));
  if (!ok) throw new ApiError(401, 'Invalid email or password');
  res.cookie(env.cookieName, signAdminToken(admin), cookieOptions());
  res.json({ admin: publicAdmin(admin) });
});

export const logout = (_req, res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(env.cookieName, opts);
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => res.json({ admin: publicAdmin(req.admin) });

export const changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!(await admin.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect', { currentPassword: 'Incorrect password' });
  admin.password = req.body.newPassword;
  await admin.save();
  res.json({ message: 'Password updated' });
});

/* ================= uploads ================= */
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'No image received');
  const folder = req.query.folder === 'categories' ? 'categories' : 'products';
  const saved = await Promise.all(req.files.map((f) => saveImage(f, folder)));
  res.status(201).json({ urls: saved.map((s) => s.url) });
});

/* ================= products ================= */
async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'item';
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

function normaliseProduct(data) {
  const out = { ...data };
  out.sku = out.sku ? out.sku : undefined;
  // De-duplicate sizes/colors, keep primary image consistent with the gallery
  out.sizes = [...new Set(out.sizes)];
  const seen = new Set();
  out.colors = out.colors.filter((c) => {
    const k = c.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  out.images = [...new Set(out.images)];
  if (!out.primaryImage || !out.images.includes(out.primaryImage)) out.primaryImage = out.images[0] || '';
  else out.images = [out.primaryImage, ...out.images.filter((i) => i !== out.primaryImage)];
  return out;
}

export const adminListProducts = asyncHandler(async (req, res) => {
  const { status, ...rest } = req.query;
  const q = { sort: 'newest', page: Number(rest.page) || 1, limit: Math.min(Number(rest.limit) || 15, 100), search: rest.search?.trim() || undefined, category: rest.category || undefined };
  if (status === 'active') q.isActive = true;
  if (status === 'inactive') q.isActive = false;
  if (['trending', 'new', 'bestseller'].includes(rest.flag)) q.flag = rest.flag;
  res.json(await listProducts(q, { admin: true }));
});

export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = normaliseProduct(req.body);
  if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, 'Selected category does not exist', { category: 'Category does not exist' });
  data.slug = await uniqueSlug(Product, data.slug || data.name);
  const product = await Product.create(data);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const data = normaliseProduct(req.body);
  if (!(await Category.exists({ _id: data.category }))) throw new ApiError(400, 'Selected category does not exist', { category: 'Category does not exist' });

  const wanted = slugify(data.slug || data.name);
  if (wanted !== product.slug) {
    if (await Product.exists({ slug: wanted, _id: { $ne: product._id } })) throw new ApiError(409, 'That slug is already in use', { slug: 'Slug already in use' });
    data.slug = wanted;
  } else data.slug = product.slug;

  const removed = product.images.filter((u) => !data.images.includes(u));
  product.set(data);
  await product.save();
  await removeImages(removed);
  res.json({ product });
});

export const patchProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await removeImages(product.images); // past orders keep their own snapshot fields
  res.json({ message: 'Product deleted' });
});

/* ================= categories ================= */
export const adminListCategories = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([Category.find().sort({ createdAt: 1 }).lean(), Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ categories: categories.map((c) => ({ ...c, productCount: map.get(String(c._id)) || 0 })) });
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.slug = await uniqueSlug(Category, data.slug || data.name);
  res.status(201).json({ category: await Category.create(data) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  const data = { ...req.body };
  const wanted = slugify(data.slug || data.name);
  if (wanted !== cat.slug) {
    if (await Category.exists({ slug: wanted, _id: { $ne: cat._id } })) throw new ApiError(409, 'That slug is already in use', { slug: 'Slug already in use' });
    data.slug = wanted;
  } else data.slug = cat.slug;
  const oldImage = cat.image;
  cat.set(data);
  await cat.save();
  if (oldImage && oldImage !== cat.image) await removeImage(oldImage);
  res.json({ category: cat });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} product(s) use this category. Move or delete them first, or deactivate the category.`);
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new ApiError(404, 'Category not found');
  await removeImage(cat.image);
  res.json({ message: 'Category deleted' });
});

/* ================= orders ================= */
export const adminListOrders = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.validQuery;
  const filter = {};
  if (status !== 'All') filter.orderStatus = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  counts.forEach((c) => { statusCounts[c._id] = c.count; });
  statusCounts.All = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)), statusCounts });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  await applyStatusChange(order, req.body.status);
  if (req.body.paymentStatus) {
    order.paymentStatus = req.body.paymentStatus;
    await order.save();
  }
  res.json({ order });
});

/* ================= customers (derived from orders) ================= */
export const adminListCustomers = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').toString().trim();
  const match = search
    ? { $or: [{ 'customer.name': new RegExp(escapeRegex(search), 'i') }, { 'customer.phone': new RegExp(escapeRegex(search), 'i') }, { 'customer.email': new RegExp(escapeRegex(search), 'i') }] }
    : {};
  const customers = await Order.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$customer.phone',
        name: { $first: '$customer.name' },
        phone: { $first: '$customer.phone' },
        email: { $first: '$customer.email' },
        city: { $first: '$shippingAddress.city' },
        state: { $first: '$shippingAddress.state' },
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 0, '$totalAmount'] } },
        lastOrderAt: { $first: '$createdAt' },
      },
    },
    { $sort: { lastOrderAt: -1 } },
    { $limit: 500 },
  ]);
  res.json({ customers });
});

/* ================= dashboard ================= */
export const dashboard = asyncHandler(async (_req, res) => {
  const [totalProducts, totalOrders, byStatus, revenueAgg, recentOrders, best, lowStock] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }]),
    Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, image: { $first: '$items.productImage' }, units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
    Product.find({ isActive: true, stock: { $lte: 5 } }).select('name stock primaryImage').sort({ stock: 1 }).limit(5).lean(),
  ]);
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  byStatus.forEach((s) => { statusCounts[s._id] = s.count; });
  res.json({
    stats: {
      totalProducts,
      totalOrders,
      pendingOrders: statusCounts.Pending,
      confirmedOrders: statusCounts.Confirmed,
      deliveredOrders: statusCounts.Delivered,
      totalRevenue: revenueAgg[0]?.revenue || 0,
    },
    statusCounts,
    recentOrders,
    bestSellers: best,
    lowStock,
  });
});

/* ================= settings ================= */
export const getAdminSettings = asyncHandler(async (_req, res) => res.json({ settings: await Settings.getStore() }));

export const updateSettings = asyncHandler(async (req, res) => {
  const s = await Settings.getStore();
  s.set(req.body);
  await s.save();
  res.json({ settings: s });
});
