import { create } from 'zustand';
import { shopService } from '../services/shopService';

const FALLBACK = {
  storeName: 'CHOLAN WEAR',
  announcement: 'Premium Streetwear | Custom Prints | Made for You',
  deliveryCharge: 60,
  freeDeliveryAbove: 1499,
  contactEmail: '',
  contactPhone: '',
  whatsapp: '',
  address: '',
  instagram: '',
  facebook: '',
};

export const useSettings = create((set, get) => ({
  settings: FALLBACK,
  loaded: false,
  async load() {
    if (get().loaded) return;
    set({ loaded: true });
    try {
      set({ settings: { ...FALLBACK, ...(await shopService.settings()) } });
    } catch { /* keep fallback */ }
  },
}));
