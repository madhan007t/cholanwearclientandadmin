import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Settings from '../models/Settings.js';
import { listProducts } from '../services/productService.js';
import { createOrder } from '../services/orderService.js';
import { ApiError, asyncHandler } from '../utils/helpers.js';

export const getProducts = asyncHandler(async (req, res) => {
  res.json(await listProducts(req.validQuery));
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug.toLowerCase(), isActive: true }).populate('category', 'name slug isActive');
  if (!product || (product.category && product.category.isActive === false)) throw new ApiError(404, 'Product not found');
  res.json({ product });
});

/** Facets for the shop filter UI: available colors, sizes and price range. */
export const getProductMeta = asyncHandler(async (_req, res) => {
  const [colors, price, sizes] = await Promise.all([
    Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$colors' },
      { $group: { _id: { $toLower: '$colors.name' }, name: { $first: '$colors.name' }, hex: { $first: '$colors.hex' } } },
      { $sort: { name: 1 } },
      { $project: { _id: 0, name: 1, hex: 1 } },
    ]),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, min: { $min: '$sellingPrice' }, max: { $max: '$sellingPrice' } } }]),
    Product.distinct('sizes', { isActive: true }),
  ]);
  const order = ['S', 'M', 'L', 'XL', 'XXL'];
  res.json({
    colors,
    sizes: sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    minPrice: price[0]?.min ?? 0,
    maxPrice: price[0]?.max ?? 0,
  });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 }).lean();
  const counts = await Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ categories: categories.map((c) => ({ ...c, productCount: map.get(String(c._id)) || 0 })) });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const s = await Settings.getStore();
  res.json({
    settings: {
      storeName: s.storeName,
      announcement: s.announcement,
      deliveryCharge: s.deliveryCharge,
      freeDeliveryAbove: s.freeDeliveryAbove,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      whatsapp: s.whatsapp,
      address: s.address,
      instagram: s.instagram,
      facebook: s.facebook,
    },
  });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const order = await createOrder(req.body);
  // Public confirmation payload - only what the customer needs to see.
  res.status(201).json({
    order: {
      orderNumber: order.orderNumber,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    },
  });
});

/** Re-prices cart lines for the cart/checkout screens (display only; order creation re-validates). */
export const quoteCart = asyncHandler(async (req, res) => {
  const lines = Array.isArray(req.body?.items) ? req.body.items.slice(0, 30) : [];
  const ids = lines.map((l) => l.productId).filter((id) => /^[a-f0-9]{24}$/i.test(id));
  const [products, settings] = await Promise.all([Product.find({ _id: { $in: ids } }).select('name slug sellingPrice originalPrice stock isActive primaryImage images sizes colors'), Settings.getStore()]);
  res.json({
    products: products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      sellingPrice: p.sellingPrice,
      originalPrice: p.originalPrice,
      stock: p.stock,
      isActive: p.isActive,
      image: p.primaryImage || p.images[0] || '',
      sizes: p.sizes,
      colors: p.colors.map((c) => c.name),
    })),
    deliveryCharge: settings.deliveryCharge,
    freeDeliveryAbove: settings.freeDeliveryAbove,
  });
});
