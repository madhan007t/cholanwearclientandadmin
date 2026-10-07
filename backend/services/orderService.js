import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import { nextSequence } from '../models/Counter.js';
import { ApiError, round2 } from '../utils/helpers.js';

/** Delivery charge rule lives server-side only. */
export function computeDelivery(subtotal, settings) {
  if (settings.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove) return 0;
  return settings.deliveryCharge;
}

/**
 * Builds a priced order from a client cart. The client only supplies product ids, size,
 * color and quantity - every price is re-read from MongoDB.
 */
export async function createOrder(payload) {
  const settings = await Settings.getStore();

  // Merge duplicate lines (same product+size+color)
  const merged = new Map();
  for (const line of payload.items) {
    const key = `${line.productId}|${line.size}|${line.color}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += line.quantity;
    else merged.set(key, { ...line });
  }
  const lines = [...merged.values()];

  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Total requested per product (stock is per product, not per variant)
  const qtyByProduct = new Map();
  const items = lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new ApiError(400, 'One of the products in your cart is no longer available. Please review your cart.');

    if (product.sizes.length > 0) {
      if (!line.size || !product.sizes.includes(line.size)) throw new ApiError(400, `Please select a valid size for "${product.name}".`);
    } else if (line.size) line.size = '';

    let colorName = '';
    if (product.colors.length > 0) {
      const found = product.colors.find((c) => c.name.toLowerCase() === line.color.toLowerCase());
      if (!found) throw new ApiError(400, `Please select a valid color for "${product.name}".`);
      colorName = found.name;
    }

    qtyByProduct.set(line.productId, (qtyByProduct.get(line.productId) || 0) + line.quantity);

    return {
      product: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.primaryImage || product.images[0] || '',
      size: line.size,
      color: colorName,
      quantity: line.quantity,
      unitPrice: product.sellingPrice,
      total: round2(product.sellingPrice * line.quantity),
    };
  });

  // Atomically reserve stock; roll back everything reserved so far if any product runs short.
  const reserved = [];
  try {
    for (const [productId, qty] of qtyByProduct) {
      const res = await Product.updateOne(
        { _id: productId, stock: { $gte: qty }, isActive: true },
        { $inc: { stock: -qty, soldCount: qty } }
      );
      if (res.modifiedCount !== 1) {
        const p = byId.get(productId);
        throw new ApiError(
          409,
          p.stock > 0 ? `Only ${p.stock} unit(s) of "${p.name}" left in stock.` : `"${p.name}" is out of stock.`
        );
      }
      reserved.push([productId, qty]);
    }

    const subtotal = round2(items.reduce((s, i) => s + i.total, 0));
    const deliveryCharge = computeDelivery(subtotal, settings);
    const totalAmount = round2(subtotal + deliveryCharge);
    const orderNumber = `CW-${await nextSequence('order')}`;

    const order = await Order.create({
      orderNumber,
      customer: payload.customer,
      shippingAddress: payload.shippingAddress,
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      statusHistory: [{ status: 'Pending' }],
    });
    return order;
  } catch (err) {
    await Promise.all(reserved.map(([id, qty]) => Product.updateOne({ _id: id }, { $inc: { stock: qty, soldCount: -qty } })));
    throw err;
  }
}

/** Return stock to inventory when an order is cancelled (and take it again if un-cancelled). */
export async function applyStatusChange(order, newStatus) {
  const was = order.orderStatus;
  if (was === newStatus) return order;

  if (newStatus === 'Cancelled' && was !== 'Cancelled') {
    await Promise.all(
      order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, soldCount: -i.quantity } }))
    );
  } else if (was === 'Cancelled') {
    // Re-activating: re-reserve stock, refuse if not enough
    const taken = [];
    try {
      for (const i of order.items) {
        const r = await Product.updateOne({ _id: i.product, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity, soldCount: i.quantity } });
        if (r.modifiedCount !== 1) throw new ApiError(409, `Not enough stock to reactivate: ${i.productName}`);
        taken.push(i);
      }
    } catch (err) {
      await Promise.all(taken.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, soldCount: -i.quantity } })));
      throw err;
    }
  }

  order.orderStatus = newStatus;
  order.statusHistory.push({ status: newStatus });
  if (newStatus === 'Delivered' && order.paymentMethod === 'COD') order.paymentStatus = 'Paid'; // cash collected on delivery
  await order.save();
  return order;
}
