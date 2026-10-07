import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Eye } from 'lucide-react';
import { useAsync, useDebounce, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { BrandLoader, EmptyState, ErrorState, Pagination } from '../../components/ui';
import { formatDate, formatPrice, ORDER_STATUSES } from '../../utils/format';
import { Card, PageHeader, SearchInput, StatusBadge, Table, Td, Th } from '../components/shared';

const TABS = ['All', ...ORDER_STATUSES];

export default function Orders() {
  useSEO('Orders');
  const [params, setParams] = useSearchParams();
  const status = TABS.includes(params.get('status')) ? params.get('status') : 'All';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(params.get('search') || '');
  const q = useDebounce(search.trim(), 350);

  const { data, loading, error, reload } = useAsync(() => adminService.orders({ status, search: q || undefined, page, limit: 15 }), [status, q, page]);

  const setParam = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'All' ? n.set(k, v) : n.delete(k)));
    setParams(n, { replace: true });
  };
  useEffect(() => { if (q !== (params.get('search') || '')) setParam({ search: q, page: '' }); /* eslint-disable-next-line */ }, [q]);

  return (
    <>
      <PageHeader title="Orders" subtitle="Review and fulfil customer orders." />
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3 no-scrollbar" role="tablist" aria-label="Order status">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={status === t} onClick={() => setParam({ status: t, page: '' })} className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${status === t ? 'border-gold text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {t}
              {data?.statusCounts && <span className={`px-1.5 py-0.5 text-[10px] ${status === t ? 'bg-gold text-brand-black' : 'bg-surface-alt text-ink-muted'}`}>{data.statusCounts[t] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="border-b border-line p-4"><div className="max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="Search order ID, customer or mobile…" label="Search orders" /></div></div>

        {loading && !data ? <BrandLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No orders found" text={q || status !== 'All' ? 'Try a different filter or search.' : 'Orders placed by customers will show up here.'} />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <Table className="min-w-[960px]">
              <thead><tr><Th>Order ID</Th><Th>Customer</Th><Th>Mobile</Th><Th>Products</Th><Th>Qty</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {data.orders.map((o) => {
                  const qty = o.items.reduce((n, i) => n + i.quantity, 0);
                  return (
                    <tr key={o._id} className="hover:bg-surface-alt">
                      <Td><Link to={`/admin/orders/${o._id}`} className="font-semibold text-gold-deep hover:underline">{o.orderNumber}</Link></Td>
                      <Td className="font-medium text-ink">{o.customer.name}</Td>
                      <Td className="whitespace-nowrap">{o.customer.phone}</Td>
                      <Td className="max-w-[220px]"><p className="truncate" title={o.items.map((i) => i.productName).join(', ')}>{o.items[0].productName}</p>{o.items.length > 1 && <p className="text-xs text-ink-muted">+{o.items.length - 1} more</p>}</Td>
                      <Td>{qty}</Td>
                      <Td className="whitespace-nowrap font-semibold">{formatPrice(o.totalAmount)}</Td>
                      <Td><div className="flex flex-col items-start gap-1"><StatusBadge status={o.paymentMethod} /><StatusBadge status={o.paymentStatus} /></div></Td>
                      <Td><StatusBadge status={o.orderStatus} /></Td>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(o.createdAt, true)}</Td>
                      <Td className="text-right"><Link to={`/admin/orders/${o._id}`} className="btn-outline btn-sm"><Eye className="h-3.5 w-3.5" /> View</Link></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="px-4 pb-4"><Pagination page={data.page} pages={data.pages} onChange={(p) => setParam({ page: p > 1 ? String(p) : '' })} /></div>
          </div>
        )}
      </Card>
    </>
  );
}
