import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { BrandLoader, Button, ErrorState } from '../../components/ui';
import { assetUrl, formatDate, formatPrice, ORDER_STATUSES } from '../../utils/format';
import { BackLink, Card, StatusBadge } from '../components/shared';

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, loading, error, reload, setData } = useAsync(() => adminService.order(id), [id]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  useSEO(order ? `Order ${order.orderNumber}` : 'Order');
  useEffect(() => { if (order) setStatus(order.orderStatus); }, [order]);

  if (loading) return <BrandLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const a = order.shippingAddress;
  const dirty = status !== order.orderStatus;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminService.setOrderStatus(order._id, { status });
      setData(updated);
      toast.success(`Order marked ${updated.orderStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStatus(order.orderStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <BackLink to="/admin/orders">All orders</BackLink>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading text-2xl sm:text-3xl">Order {order.orderNumber}</h1>
          <p className="mt-2 text-sm text-ink-muted">Placed {formatDate(order.createdAt, true)}</p>
          <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={order.orderStatus} /><StatusBadge status={order.paymentMethod} /><StatusBadge status={order.paymentStatus} /></div>
        </div>
        <button className="btn-outline btn-sm print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <div className="border-b border-line px-5 py-4"><h2 className="heading text-base">Items</h2></div>
            <ul className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-4 p-4 sm:px-5">
                  <img src={assetUrl(i.productImage)} alt="" className="h-20 w-16 shrink-0 bg-surface-alt object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{i.productName}</p>
                    <p className="mt-1 text-xs text-ink-muted">{[i.size && `Size ${i.size}`, i.color && `Color ${i.color}`].filter(Boolean).join(' · ') || 'No options'}</p>
                    <p className="mt-1 text-xs text-ink-muted">{formatPrice(i.unitPrice)} × {i.quantity}</p>
                  </div>
                  <p className="font-semibold text-ink">{formatPrice(i.total)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line bg-surface-alt p-5 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.deliveryCharge ? formatPrice(order.deliveryCharge) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>Total</dt><dd className="text-gold-deep">{formatPrice(order.totalAmount)}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="heading text-base">Status history</h2>
            <ol className="mt-4 space-y-3 border-l border-line pl-5">
              {[...(order.statusHistory || [])].reverse().map((h, i) => (
                <li key={i} className="relative text-sm"><span className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 ${i === 0 ? 'bg-gold' : 'bg-line'}`} /><span className="font-semibold text-ink">{h.status}</span> <span className="text-ink-muted">· {formatDate(h.at, true)}</span></li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 print:hidden">
            <h2 className="heading text-base">Update status</h2>
            <label htmlFor="status" className="label mt-4">Order status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <Button variant="gold" className="mt-4 w-full" loading={saving} disabled={!dirty} onClick={save}>Save status</Button>
            {status === 'Cancelled' && dirty && <p className="mt-3 text-xs text-ink-muted">Cancelling returns the items to stock.</p>}
          </Card>

          <Card className="p-5">
            <h2 className="heading text-base">Customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="label !mb-0.5">Name</dt><dd className="text-ink">{order.customer.name}</dd></div>
              <div><dt className="label !mb-0.5">Phone</dt><dd><a className="text-gold-deep hover:underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></dd></div>
              {order.customer.alternatePhone && <div><dt className="label !mb-0.5">Alternate phone</dt><dd>{order.customer.alternatePhone}</dd></div>}
              {order.customer.email && <div><dt className="label !mb-0.5">Email</dt><dd className="break-all">{order.customer.email}</dd></div>}
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="heading text-base">Delivery address</h2>
            <address className="mt-4 text-sm not-italic leading-relaxed text-ink">
              {a.addressLine1}<br />{a.addressLine2 && <>{a.addressLine2}<br /></>}{a.landmark && <>Landmark: {a.landmark}<br /></>}{a.city}, {a.district}<br />{a.state} - {a.pincode}
            </address>
          </Card>
        </div>
      </div>
    </>
  );
}
