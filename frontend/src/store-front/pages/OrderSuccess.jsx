import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { useSEO } from '../../hooks';
import { Modal } from '../../components/ui';
import { assetUrl, formatPrice } from '../../utils/format';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import Confetti from '../components/Confetti';

function loadOrder(state) {
  if (state?.order) return state.order;
  try { return JSON.parse(sessionStorage.getItem('cholan-last-order')); } catch { return null; }
}

/** True once the tab is actually on screen - the WhatsApp tab usually takes focus right after ordering. */
function usePageVisible() {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    if (visible) return undefined;
    const fn = () => !document.hidden && setVisible(true);
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [visible]);
  return visible;
}

export default function OrderSuccess() {
  useSEO('Order created');
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = loadOrder(state);
  // Captured once: the celebration is for a fresh order, not for a reload of this page.
  const [modalOpen, setModalOpen] = useState(() => !!state?.justPlaced);
  const [waOpened] = useState(() => !!state?.waOpened);
  const visible = usePageVisible();

  useEffect(() => {
    if (state?.justPlaced) navigate('.', { replace: true, state: { order: state.order } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) return <Navigate to="/shop" replace />;
  const a = order.shippingAddress;
  const waUrl = buildWhatsAppUrl(order);
  // A real link clicked by the customer - never blocked by popup blockers.
  const waButton = (className) => (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" className={className}><MessageCircle className="h-4 w-4" /> Open WhatsApp</a>
  );

  return (
    <div className="bg-surface-alt py-12 sm:py-20">
      <div className="container-page max-w-3xl">
        <div className="animate-fade-up border border-line bg-surface p-6 text-center sm:p-12">
          <span className="mx-auto flex h-20 w-20 items-center justify-center border-2 border-gold text-gold-deep"><Check className="h-9 w-9" strokeWidth={2} /></span>
          <p className="eyebrow mt-8">Order created</p>
          <h1 className="heading mt-3 text-3xl sm:text-4xl">Thank you for your order</h1>
          <span className="gold-rule mx-auto mt-5" />
          <p className="mx-auto mt-5 max-w-md text-sm text-ink-soft">Your order has been created. Please send the pre-filled WhatsApp message to CHOLAN WEAR to complete your confirmation. We'll contact you on {order.customer.phone}.</p>
          {waButton('btn-gold mt-6')}

          <dl className="mt-10 grid gap-px border border-line bg-line text-left sm:grid-cols-2">
            {[
              ['Order ID', order.orderNumber],
              ['Customer', order.customer.name],
              ['Mobile', order.customer.phone],
              ['Total amount', formatPrice(order.totalAmount)],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4"><dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{k}</dt><dd className={`mt-1 font-semibold ${k === 'Order ID' ? 'text-gold-deep' : 'text-ink'}`}>{v}</dd></div>
            ))}
            <div className="bg-surface p-4 sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Delivery address</dt>
              <dd className="mt-1 text-sm text-ink">{[a.addressLine1, a.addressLine2, a.landmark && `Near ${a.landmark}`, a.city, a.district, `${a.state} - ${a.pincode}`].filter(Boolean).join(', ')}</dd>
            </div>
          </dl>

          <ul className="mt-8 divide-y divide-line border-y border-line text-left">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-4 py-3">
                <img src={assetUrl(i.productImage)} alt="" className="h-16 w-14 bg-surface-alt object-cover" />
                <div className="min-w-0 flex-1 text-sm"><p className="font-semibold text-ink">{i.productName}</p><p className="text-xs text-ink-muted">{[i.size, i.color].filter(Boolean).join(' · ')} · Qty {i.quantity}</p></div>
                <p className="text-sm font-semibold text-ink">{formatPrice(i.total)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 text-right text-sm text-ink-soft">
            <p>Subtotal {formatPrice(order.subtotal)}</p>
            <p>Delivery {order.deliveryCharge === 0 ? 'Free' : formatPrice(order.deliveryCharge)}</p>
          </div>

          <Link to="/shop" className="btn-dark mt-10">Continue shopping</Link>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="order-created-title">
        {/* Animations wait until the customer is actually looking at this tab. */}
        {visible && (
          <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
            <span className="mx-auto flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-success text-brand-white"><Check className="h-12 w-12" strokeWidth={2.5} /></span>
            <div className="animate-fade-up [animation-delay:.45s]">
              <h2 id="order-created-title" className="heading mt-7 text-xl sm:text-2xl">Order created successfully!</h2>
              <span className="gold-rule mx-auto mt-4" />
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Order ID</p>
              <p className="mt-1 text-lg font-bold text-gold-deep">{order.orderNumber}</p>
              <p className="mx-auto mt-5 max-w-sm text-sm text-ink-soft">Your order has been created. Please send the pre-filled WhatsApp message to CHOLAN WEAR to complete your confirmation.</p>
              <p className="mt-3 text-sm text-ink-soft">Our team will contact you shortly.</p>
              {!waOpened && <p className="mx-auto mt-4 max-w-sm border border-gold/50 bg-gold-tint px-3 py-2 text-xs text-ink">WhatsApp didn't open automatically. Tap “Open WhatsApp” below to send your order.</p>}
              <div className="mt-8 flex flex-col gap-3">
                {waButton('btn-gold w-full py-4')}
                <Link to="/shop" className="btn-outline w-full">Continue shopping</Link>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {modalOpen && visible && <Confetti />}
    </div>
  );
}
