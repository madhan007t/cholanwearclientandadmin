import mongoose from 'mongoose';

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    hex: { type: String, default: '#000000', match: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/ },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, trim: true, uppercase: true, maxlength: 40, default: undefined },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, default: '', maxlength: 5000 },
    sellingPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sizes: { type: [{ type: String, enum: SIZES }], default: [] },
    colors: { type: [colorSchema], default: [] },
    images: { type: [String], default: [] },
    primaryImage: { type: String, default: '' },
    fabric: { type: String, default: '', maxlength: 200 },
    fit: { type: String, default: '', maxlength: 200 },
    washCare: { type: String, default: '', maxlength: 300 },
    isTrending: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string' } } });
productSchema.index({ name: 'text', shortDescription: 'text' });

productSchema.virtual('discountPercent').get(function discount() {
  if (this.originalPrice > this.sellingPrice && this.originalPrice > 0) {
    return Math.round(((this.originalPrice - this.sellingPrice) / this.originalPrice) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);
