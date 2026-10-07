import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { useSEO } from '../../hooks';
import { useCartStore } from '../../store/cartStore';
import { shopService } from '../../services/shopService';
import { getFieldErrors } from '../../services/api';
import { Button, EmptyState, Field, Modal } from '../../components/ui';
import { MAX_QTY_PER_LINE, assetUrl, formatPrice } from '../../utils/format';
import { buildWhatsAppUrl, closeTab, reserveTab, sendTabTo } from '../../utils/whatsapp';
import { useCartSync, useCartTotals } from '../hooks';
import { OrderTotals } from './Cart';

const PHONE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initial = {
  name: '', phone: '', alternatePhone: '', email: '',
  addressLine1: '', addressLine2: '', landmark: '', city: '', district: '', state: '', pincode: '',
};

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Full name is required';
  if (!PHONE.test(f.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';
  if (f.alternatePhone.trim() && !PHONE.test(f.alternatePhone.trim())) e.alternatePhone = 'Enter a valid 10-digit mobile number';
  if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (f.addressLine1.trim().length < 3) e.addressLine1 = 'Address is required';
  if (f.city.trim().length < 2) e.city = 'City is required';
  if (f.district.trim().length < 2) e.district = 'District is required';
  if (f.state.trim().length < 2) e.state = 'State is required';
  if (!/^[1-9]\d{5}$/.test(f.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
  return e;
}

const ORDER_FAILED = 'Unable to place your order. Please try again.';

/** Cart checks before the confirmation step. Returns a message, or '' when the cart is fine. */
async function findCartIssue(items) {
  if (items.length === 0) return 'Your cart is empty.';
  if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY_PER_LINE)) return 'One of the quantities in your cart is not valid. Please review your cart.';

  let products;
  try {
    ({ products } = await shopService.quote(items.map((i) => ({ productId: i.productId }))));
  } catch {
    return ''; // can't pre-check right now - the server validates all of this again when the order is created
  }
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const qty = new Map();
  for (const i of items) {
    const p = byId.get(i.productId);
    if (!p || !p.isActive) return `"${i.name}" is no longer available. Please review your cart.`;
    if (p.sizes?.length && !p.sizes.includes(i.size)) return `Please select a size for "${p.name}".`;
    if (p.colors?.length && !p.colors.some((c) => c.toLowerCase() === (i.color || '').toLowerCase())) return `Please select a color for "${p.name}".`;
    qty.set(i.productId, (qty.get(i.productId) || 0) + i.quantity);
  }
  for (const [id, n] of qty) {
    const p = byId.get(id);
    if (n > p.stock) return p.stock > 0 ? `Only ${p.stock} unit(s) of "${p.name}" left in stock.` : `"${p.name}" is out of stock.`;
  }
  return '';
}

export default function Checkout() {
  useSEO('Checkout');
  useCartSync();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const totals = useCartTotals();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState(null); // null = no failure; string = server's reason ('' if none)
  const placed = useRef(false);
  const lock = useRef(false);

  useEffect(() => {
    if (items.length === 0 && !placed.current) navigate('/cart', { replace: true });
  }, [items.length, navigate]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const t = (k) => form[k].trim();

  // Step 1 - PLACE ORDER: validate everything, then ask for confirmation. Nothing is sent yet.
  const submit = async (e) => {
    e.preventDefault();
    if (checking || submitting) return;
    setFormError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error('Please fix the highlighted fields');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setChecking(true);
    const issue = await findCartIssue(items);
    setChecking(false);
    if (issue) {
      setFormError(issue);
      toast.error(issue);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setConfirmError(null);
    setConfirmOpen(true);
  };

  // Step 2 - CONFIRM ORDER: save on the server, then hand the saved order to WhatsApp.
  const confirm = async () => {
    if (lock.current) return; // no double submits, even before React re-renders the disabled button
    lock.current = true;
    setSubmitting(true);
    setConfirmError(null);
    const waTab = reserveTab(); // must happen synchronously in the click, before any await
    let order;
    try {
      order = await shopService.placeOrder({
        customer: { name: t('name'), phone: t('phone'), alternatePhone: t('alternatePhone'), email: t('email') },
        shippingAddress: { addressLine1: t('addressLine1'), addressLine2: t('addressLine2'), landmark: t('landmark'), city: t('city'), district: t('district'), state: t('state'), pincode: t('pincode') },
        // Only ids / options / quantities - never prices.
        items: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
      });
    } catch (err) {
      closeTab(waTab);
      const mapped = {};
      Object.entries(getFieldErrors(err)).forEach(([k, msg]) => { mapped[k.split('.').pop()] = msg; });
      const reason = err?.response?.data?.message; // e.g. "Only 2 unit(s) of ... left in stock."
      toast.error(ORDER_FAILED);
      if (Object.keys(mapped).length) {
        // A field was rejected by the server: back to the form so it can be corrected.
        setErrors(mapped);
        setFormError(reason ? `${ORDER_FAILED} ${reason}` : ORDER_FAILED);
        setConfirmOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setConfirmError(reason || '');
      }
      lock.current = false;
      setSubmitting(false);
      return;
    }

    // The order is saved. From here on nothing may lose it, whatever WhatsApp does.
    placed.current = true;
    try { sessionStorage.setItem('cholan-last-order', JSON.stringify(order)); } catch { /* private mode */ }
    const waOpened = sendTabTo(waTab, buildWhatsAppUrl(order));
    clear(); // only after the server confirmed the order
    navigate('/order-success', { replace: true, state: { order, justPlaced: true, waOpened } });
  };

  if (items.length === 0) return <EmptyState title="Your cart is empty" action={<Link to="/shop" className="btn-dark">Shop now</Link>} />;

  const closeConfirm = () => { if (!submitting) setConfirmOpen(false); };
  const deliveryAddress = [t('addressLine1'), t('addressLine2'), t('landmark') && `Near ${t('landmark')}`, t('city'), t('district'), `${t('state')} - ${t('pincode')}`].filter(Boolean).join(', ');

  const input = (k, label, { className, required, ...props } = {}) => (
    <Field label={label} required={required} error={errors[k]} htmlFor={`f-${k}`} className={className}>
      <input id={`f-${k}`} name={k} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-required={required || undefined} className={`field ${errors[k] ? 'field-error' : ''}`} {...props} />
    </Field>
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="heading text-3xl sm:text-4xl">Checkout</h1>
      <span className="gold-rule mt-4" />
      {formError && <div role="alert" className="mt-6 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{formError}</div>}

      <form onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section aria-labelledby="cust">
            <h2 id="cust" className="heading text-lg">1. Customer details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {input('name', 'Full name', { required: true, autoComplete: 'name', className: 'sm:col-span-2' })}
              {input('phone', 'Mobile number', { required: true, type: 'tel', inputMode: 'numeric', autoComplete: 'tel', placeholder: '10-digit number', maxLength: 14 })}
              {input('alternatePhone', 'Alternate mobile (optional)', { type: 'tel', inputMode: 'numeric', maxLength: 14 })}
              {input('email', 'Email (optional)', { type: 'email', autoComplete: 'email', className: 'sm:col-span-2' })}
            </div>
          </section>

          <section aria-labelledby="addr">
            <h2 id="addr" className="heading text-lg">2. Delivery address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {input('addressLine1', 'Address line 1', { required: true, autoComplete: 'address-line1', className: 'sm:col-span-2', placeholder: 'House / flat no., street' })}
              {input('addressLine2', 'Address line 2', { autoComplete: 'address-line2', className: 'sm:col-span-2' })}
              {input('landmark', 'Landmark', { className: 'sm:col-span-2' })}
              {input('city', 'City', { required: true, autoComplete: 'address-level2' })}
              {input('district', 'District', { required: true })}
              {input('state', 'State', { required: true, autoComplete: 'address-level1' })}
              {input('pincode', 'Pincode', { required: true, inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
            </div>
          </section>
        </div>

        <aside className="h-fit border border-line bg-surface-alt p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="heading text-lg">Order summary</h2>
          <ul className="mt-5 max-h-80 divide-y divide-line overflow-y-auto">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 py-3">
                <div className="relative w-14 shrink-0">
                  <img src={assetUrl(i.image)} alt="" className="aspect-[4/5] w-full bg-surface object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-brand-black px-1 text-[10px] font-bold text-brand-white">{i.quantity}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold leading-snug text-ink">{i.name}</p>
                  <p className="text-xs text-ink-muted">{[i.size, i.color].filter(Boolean).join(' · ')} · {formatPrice(i.price)} × {i.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{formatPrice(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-5"><OrderTotals totals={totals} /></div>
          <Button type="submit" variant="gold" loading={checking} className="mt-6 w-full py-4">Place order</Button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><Lock className="h-3.5 w-3.5" /> Final price is confirmed securely by our server.</p>
          <Link to="/cart" className="link-underline mt-4 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink">Edit cart</Link>
        </aside>
      </form>

      <Modal open={confirmOpen} onClose={closeConfirm} title="Confirm your order" labelledBy="confirm-order-title">
        <div className="p-5 sm:p-6">
          <p className="text-sm text-ink-soft">Your order details will be sent to CHOLAN WEAR on WhatsApp. Our team will contact you to confirm your order.</p>
          <span className="gold-rule mt-4" />

          <dl className="mt-5 space-y-3 text-sm">
            {[['Customer', t('name')], ['Mobile', t('phone')], ['Delivery', deliveryAddress]].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[84px_1fr] gap-3">
                <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{k}</dt>
                <dd className="break-words text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Order</p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.key} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-ink">{i.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{[i.size && `Size: ${i.size}`, i.color && `Color: ${i.color}`, `Qty: ${i.quantity}`].filter(Boolean).join('  ·  ')}</p>
                </div>
                <p className="shrink-0 font-semibold text-ink">{formatPrice(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-semibold text-ink">{formatPrice(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="font-semibold text-ink">{totals.delivery === 0 ? 'Free' : formatPrice(totals.delivery)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-semibold text-ink">Total</dt><dd className="text-lg font-bold text-gold-deep">{formatPrice(totals.total)}</dd></div>
          </dl>

          {confirmError !== null && (
            <div role="alert" className="mt-5 border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">{ORDER_FAILED}{confirmError && ` ${confirmError}`}</div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-line bg-surface p-4 sm:flex-row sm:px-6">
          <button type="button" className="btn-outline w-full sm:flex-1" onClick={closeConfirm} disabled={submitting}>Cancel</button>
          <Button type="button" variant="gold" className="w-full sm:flex-1" loading={submitting} onClick={confirm}>{submitting ? 'Placing order…' : 'Confirm order'}</Button>
        </div>
      </Modal>
    </div>
  );
}
