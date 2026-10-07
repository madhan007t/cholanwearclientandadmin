import { useEffect } from 'react';
import { useCartStore, selectSubtotal } from '../store/cartStore';
import { useSettings } from '../store/settingsStore';
import { shopService } from '../services/shopService';

/** Display totals. The server recomputes these authoritatively when the order is placed. */
export function useCartTotals() {
  const subtotal = useCartStore(selectSubtotal);
  const { deliveryCharge, freeDeliveryAbove } = useSettings((s) => s.settings);
  const delivery = subtotal === 0 ? 0 : freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove ? 0 : deliveryCharge;
  return { subtotal, delivery, total: subtotal + delivery, freeDeliveryAbove, remainingForFree: Math.max(0, freeDeliveryAbove - subtotal) };
}

/** Refresh cart prices/stock from the API once on mount (and drop discontinued products). */
export function useCartSync() {
  const items = useCartStore((s) => s.items);
  const sync = useCartStore((s) => s.syncWithServer);
  const load = useSettings((s) => s.load);
  useEffect(() => {
    load();
    if (!items.length) return;
    shopService.quote(items.map((i) => ({ productId: i.productId }))).then((d) => sync(d.products)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
