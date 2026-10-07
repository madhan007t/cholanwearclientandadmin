import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_QTY_PER_LINE } from '../utils/format';

const lineKey = (productId, size, color) => `${productId}|${size || ''}|${color || ''}`;
const clampQty = (qty, stock) => Math.max(1, Math.min(Math.floor(Number(qty) || 1), MAX_QTY_PER_LINE, stock > 0 ? stock : MAX_QTY_PER_LINE));

/**
 * Cart persisted in localStorage. Prices stored here are for DISPLAY only -
 * the server re-prices every order from the database.
 * Line: { key, productId, slug, name, size, color, quantity, price, image, stock }
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ productId, slug, name, size = '', color = '', quantity = 1, price, image, stock = 0 }) => {
        const key = lineKey(productId, size, color);
        const items = get().items;
        const existing = items.find((i) => i.key === key);
        if (existing) {
          set({ items: items.map((i) => (i.key === key ? { ...i, price, image, stock, quantity: clampQty(i.quantity + quantity, stock) } : i)) });
        } else {
          set({ items: [...items, { key, productId, slug, name, size, color, quantity: clampQty(quantity, stock), price, image, stock }] });
        }
      },

      setQuantity: (key, quantity) =>
        set({ items: get().items.map((i) => (i.key === key ? { ...i, quantity: clampQty(quantity, i.stock) } : i)) }),

      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),

      /** Refresh display price / stock from the server; drop lines whose product is gone. */
      syncWithServer: (products) => {
        const map = new Map(products.filter((p) => p.isActive).map((p) => [String(p._id), p]));
        set({
          items: get()
            .items.filter((i) => map.has(i.productId))
            .map((i) => {
              const p = map.get(i.productId);
              return { ...i, price: p.sellingPrice, stock: p.stock, name: p.name, image: p.image || i.image, quantity: clampQty(i.quantity, p.stock) };
            }),
        });
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: 'cholan-wear-cart',
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export const selectCount = (s) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s) => s.items.reduce((n, i) => n + i.price * i.quantity, 0);
