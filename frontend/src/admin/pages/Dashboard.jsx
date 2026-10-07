import { Link } from 'react-router-dom';
import { Package, ClipboardList, Clock, CheckCircle2, Truck, IndianRupee, PackageOpen } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { BrandLoader, EmptyState, ErrorState } from '../../components/ui';
import { assetUrl, formatDate, formatPrice, ORDER_STATUSES } from '../../utils/format';
import { Card, PageHeader, StatusBadge, Table, Td, Th } from '../components/shared';

const BAR = { Pending: 'bg-gold/50', Confirmed: 'bg-gold', Processing: 'bg-gold-dark', Shipped: 'bg-ink-muted', Delivered: 'bg-brand-black', Cancelled: 'bg-danger/60' };

export default function Dashboard() {
  useSEO('Dashboard');
  const { data, loading, error, reload } = useAsync(() => adminService.dashboard(), []);
  if (loading) return <BrandLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, statusCounts, recentOrders, bestSellers, lowStock } = data;
  const cards = [
    ['Total products', stats.totalProducts, Package, '/admin/products'],
    ['Total orders', stats.totalOrders, ClipboardList, '/admin/orders'],
    ['Pending orders', stats.pendingOrders, Clock, '/admin/orders?status=Pending'],
    ['Confirmed orders', stats.confirmedOrders, CheckCircle2, '/admin/orders?status=Confirmed'],
    ['Delivered orders', stats.deliveredOrders, Truck, '/admin/orders?status=Delivered'],
    ['Total revenue', formatPrice(stats.totalRevenue), IndianRupee, '/admin/orders'],
  ];
  const max = Math.max(1, ...Object.values(statusCounts));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live overview of your store." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        {cards.map(([label, value, Icon, to], i) => (
          <Link key={label} to={to} className={`group border p-4 transition-colors sm:p-5 ${i === 5 ? 'border-brand-black bg-brand-black text-brand-white' : 'border-line bg-surface hover:border-gold'}`}>
            <Icon className={`h-5 w-5 ${i === 5 ? 'text-gold' : 'text-gold-deep'}`} strokeWidth={1.6} />
            <p className={`mt-4 font-display text-2xl font-semibold sm:text-3xl ${i === 5 ? 'text-gold' : 'text-ink'}`}>{value}</p>
            <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 5 ? 'text-brand-white/70' : 'text-ink-muted'}`}>{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <h2 className="heading text-base">Order status overview</h2>
          <ul className="mt-5 space-y-3.5">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-ink">{s}</span><span className="text-ink-muted">{statusCounts[s] || 0}</span></div>
                <div className="h-2 bg-surface-alt"><div className={`h-full transition-all duration-700 ${BAR[s]}`} style={{ width: `${((statusCounts[s] || 0) / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6"><h2 className="heading text-base">Recent orders</h2><Link to="/admin/orders" className="link-underline text-xs font-semibold uppercase tracking-wider">View all</Link></div>
          {recentOrders.length === 0 ? <EmptyState title="No orders yet" text="New orders will appear here." /> : (
            <Table>
              <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-surface-alt">
                    <Td><Link to={`/admin/orders/${o._id}`} className="font-semibold text-gold-deep hover:underline">{o.orderNumber}</Link></Td>
                    <Td>{o.customer.name}</Td><Td className="font-semibold">{formatPrice(o.totalAmount)}</Td>
                    <Td><StatusBadge status={o.orderStatus} /></Td><Td className="whitespace-nowrap text-ink-muted">{formatDate(o.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="border-b border-line px-5 py-4 sm:px-6"><h2 className="heading text-base">Best-selling products</h2></div>
          {bestSellers.length === 0 ? <EmptyState icon={PackageOpen} title="No sales data yet" text="Best sellers appear once orders come in." /> : (
            <ul className="divide-y divide-line">
              {bestSellers.map((b, i) => (
                <li key={b._id || i} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                  <span className="w-5 font-display text-gold-deep">{i + 1}</span>
                  <img src={assetUrl(b.image)} alt="" className="h-14 w-12 bg-surface-alt object-cover" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{b.name}</p>
                  <div className="text-right text-xs"><p className="font-semibold text-ink">{b.units} sold</p><p className="text-ink-muted">{formatPrice(b.revenue)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4 sm:px-6"><h2 className="heading text-base">Low stock</h2></div>
          {lowStock.length === 0 ? <p className="p-6 text-sm text-ink-muted">All active products are well stocked.</p> : (
            <ul className="divide-y divide-line">
              {lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                  <Link to={`/admin/products/${p._id}`} className="min-w-0 truncate text-sm text-ink hover:text-gold-deep">{p.name}</Link>
                  <span className={`shrink-0 border px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? 'border-danger/50 text-danger' : 'border-gold text-gold-deep'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
