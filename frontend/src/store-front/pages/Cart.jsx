import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useSEO } from '../../hooks';
import { useCartStore } from '../../store/cartStore';
import { EmptyState, QuantityStepper } from '../../components/ui';
import { assetUrl, formatPrice } from '../../utils/format';
import { useCartSync, useCartTotals } from '../hooks';

export function OrderTotals({ totals }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-semibold text-ink">{formatPrice(totals.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-ink-soft">Delivery charge</dt><dd className="font-semibold text-ink">{totals.delivery === 0 ? 'Free' : formatPrice(totals.delivery)}</dd></div>
      <div className="flex justify-between border-t border-line pt-4 text-base"><dt className="font-semibold text-ink">Grand total</dt><dd className="text-xl font-bold text-gold-deep">{formatPrice(totals.total)}</dd></div>
    </dl>
  );
}

export default function Cart() {
  useSEO('Your cart');
  useCartSync();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totals = useCartTotals();

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Looks like you haven't added anything yet. Find your next favourite tee." action={<Link to="/shop" className="btn-gold">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="heading text-3xl sm:text-4xl">Your cart</h1>
      <span className="gold-rule mt-4" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((i) => (
            <li key={i.key} className="flex gap-4 py-5 sm:gap-6">
              <Link to={`/product/${i.slug}`} className="block w-24 shrink-0 bg-surface-alt sm:w-32">
                <img src={assetUrl(i.image)} alt={i.name} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${i.slug}`} className="block text-sm font-semibold text-ink hover:text-gold-deep sm:text-base">{i.name}</Link>
                    <p className="mt-1 text-xs text-ink-muted">{[i.size && `Size: ${i.size}`, i.color && `Color: ${i.color}`].filter(Boolean).join('  ·  ')}</p>
                    <p className="mt-1 text-sm text-gold-deep">{formatPrice(i.price)}</p>
                  </div>
                  <p className="hidden shrink-0 text-base font-bold text-ink sm:block">{formatPrice(i.price * i.quantity)}</p>
                </div>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <QuantityStepper size="sm" value={i.quantity} max={Math.min(10, i.stock || 10)} onChange={(q) => setQuantity(i.key, q)} />
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-ink sm:hidden">{formatPrice(i.price * i.quantity)}</p>
                    <button onClick={() => removeItem(i.key)} aria-label={`Remove ${i.name}`} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-danger"><Trash2 className="h-4 w-4" /><span className="max-sm:hidden">Remove</span></button>
                  </div>
                </div>
                {i.stock > 0 && i.quantity >= Math.min(10, i.stock) && <p className="mt-2 text-xs text-gold-deep">Maximum available quantity reached.</p>}
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-line bg-surface-alt p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="heading text-lg">Summary</h2>
          <div className="mt-5"><OrderTotals totals={totals} /></div>
          {totals.freeDeliveryAbove > 0 && totals.remainingForFree > 0 && <p className="mt-4 border border-gold/50 bg-gold-tint px-3 py-2 text-xs text-ink">Add {formatPrice(totals.remainingForFree)} more for free delivery.</p>}
          <button onClick={() => navigate('/checkout')} className="btn-dark mt-6 w-full py-4">Proceed to checkout</button>
          <Link to="/shop" className="link-underline mt-4 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink">Continue shopping</Link>
          <p className="mt-5 text-center text-xs text-ink-muted">Cash on delivery available · No account needed</p>
        </aside>
      </div>
    </div>
  );
}
