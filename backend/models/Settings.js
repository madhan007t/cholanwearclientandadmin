import mongoose from 'mongoose';

// Singleton document holding store-wide configuration editable from the admin panel.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true },
    storeName: { type: String, default: 'CHOLAN WEAR' },
    announcement: { type: String, default: 'Premium Streetwear | Custom Prints | Made for You' },
    deliveryCharge: { type: Number, default: 60, min: 0 },
    freeDeliveryAbove: { type: Number, default: 1499, min: 0 }, // 0 disables free delivery
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
  },
  { timestamps: true }
);

settingsSchema.statics.getStore = async function getStore() {
  return this.findOneAndUpdate({ key: 'store' }, { $setOnInsert: { key: 'store' } }, { upsert: true, returnDocument: 'after' });
};

export default mongoose.model('Settings', settingsSchema);
