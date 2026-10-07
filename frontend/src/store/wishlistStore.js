import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lightweight, device-local wishlist (no account needed).
export const useWishlist = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => set({ ids: get().ids.includes(id) ? get().ids.filter((i) => i !== id) : [...get().ids, id] }),
    }),
    { name: 'cholan-wear-wishlist' }
  )
);
