import mongoose from 'mongoose';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
// 'whatsapp_confirmation' = no payment method chosen at checkout; the team confirms the order on WhatsApp.
// Internal value only - never shown to the customer. 'COD' is kept so older orders stay valid.
export const PAYMENT_METHODS = ['COD', 'whatsapp_confirmation'];
export const DEFAULT_PAYMENT_METHOD = 'whatsapp_confirmation';
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

// Snapshot of the product at purchase time - never changes when the product is edited later.
const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    productSlug: { type: String },
    productImage: { type: String, default: '' },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true, index: true },
      alternatePhone: { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
    },
    shippingAddress: {
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, default: '', trim: true },
      landmark: { type: String, default: '', trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: DEFAULT_PAYMENT_METHOD },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
