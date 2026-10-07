import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync, useDebounce, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { BrandLoader, ConfirmDialog, EmptyState, ErrorState, Pagination } from '../../components/ui';
import { assetUrl, formatPrice } from '../../utils/format';
import { Card, PageHeader, SearchInput, StatusBadge, Table, Td, Th, Toggle } from '../components/shared';

export default function Products() {
  useSEO('Products');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [flag, setFlag] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const q = useDebounce(search.trim(), 350);

  const { data: cats } = useAsync(() => adminService.categories(), []);
  const { data, loading, error, reload, setData } = useAsync(
    () => adminService.products({ search: q || undefined, status: status || undefined, category: category || undefined, flag: flag || undefined, page, limit: 12 }),
    [q, status, category, flag, page]
  );

  const filter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const patch = async (p, body) => {
    setBusyId(p._id);
    try {
      const updated = await adminService.patchProduct(p._id, body);
      setData({ ...data, products: data.products.map((x) => (x._id === p._id ? { ...x, ...updated, category: x.category } : x)) });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminService.deleteProduct(toDelete._id);
      toast.success('Product deleted');
      setToDelete(null);
      if (data.products.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Products" subtitle={data ? `${data.total} product${data.total === 1 ? '' : 's'}` : ' '} actions={<Link to="/admin/products/new" className="btn-gold"><Plus className="h-4 w-4" /> Add product</Link>} />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, SKU…" label="Search products" />
          <select aria-label="Filter by category" value={category} onChange={filter(setCategory)} className="field">
            <option value="">All categories</option>{cats?.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
          </select>
          <select aria-label="Filter by status" value={status} onChange={filter(setStatus)} className="field">
            <option value="">Active & inactive</option><option value="active">Active only</option><option value="inactive">Inactive only</option>
          </select>
          <select aria-label="Filter by tag" value={flag} onChange={filter(setFlag)} className="field">
            <option value="">All tags</option><option value="trending">Trending</option><option value="new">New arrival</option><option value="bestseller">Best seller</option>
          </select>
        </div>

        {loading && !data ? <BrandLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.products.length === 0 ? (
          <EmptyState icon={Package} title="No products found" text={q || status || category || flag ? 'Try changing your filters.' : 'Add your first product to start selling.'} action={<Link to="/admin/products/new" className="btn-gold">Add product</Link>} />
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <Table className="min-w-[900px]">
              <thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Tags</Th><Th>Active</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-alt">
                    <Td>
                      <div className="flex items-center gap-3">
                        <img src={assetUrl(p.primaryImage || p.images?.[0])} alt="" className="h-14 w-11 shrink-0 bg-surface-alt object-cover" loading="lazy" />
                        <div className="min-w-0"><Link to={`/admin/products/${p._id}`} className="block max-w-[260px] truncate font-semibold text-ink hover:text-gold-deep">{p.name}</Link><p className="text-xs text-ink-muted">{p.sku || 'No SKU'}</p></div>
                      </div>
                    </Td>
                    <Td>{p.category?.name || '—'}</Td>
                    <Td className="whitespace-nowrap"><span className="font-semibold">{formatPrice(p.sellingPrice)}</span>{p.originalPrice > p.sellingPrice && <span className="ml-1.5 text-xs text-ink-muted line-through">{formatPrice(p.originalPrice)}</span>}</Td>
                    <Td><span className={p.stock <= 5 ? 'font-semibold text-danger' : ''}>{p.stock}</span></Td>
                    <Td>
                      <div className="flex flex-col gap-1.5 text-xs">
                        {[['isTrending', 'Trending'], ['isNewArrival', 'New'], ['isBestSeller', 'Best seller']].map(([k, l]) => (
                          <label key={k} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={!!p[k]} disabled={busyId === p._id} onChange={(e) => patch(p, { [k]: e.target.checked })} className="h-3.5 w-3.5 accent-gold" /> {l}</label>
                        ))}
                      </div>
                    </Td>
                    <Td><div className="flex items-center gap-2"><Toggle checked={p.isActive} disabled={busyId === p._id} label={`${p.name} active`} onChange={(v) => patch(p, { isActive: v })} /><StatusBadge status={p.isActive ? 'Active' : 'Inactive'} /></div></Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/products/${p._id}`} className="btn-outline btn-sm" aria-label={`Edit ${p.name}`}><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                        <button className="btn-outline btn-sm hover:!border-danger hover:!bg-danger" aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="px-4 pb-4"><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={!!toDelete} loading={deleting} title="Delete product" message={`Delete “${toDelete?.name}” permanently? Its images are removed too. Past orders keep their own copy of the item details.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  );
}
