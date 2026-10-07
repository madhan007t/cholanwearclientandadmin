import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, SearchX } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { shopService } from '../../services/shopService';
import { EmptyState, ErrorState, Modal, Pagination } from '../../components/ui';
import { FadeUp } from '../../components/motion';
import { SIZES, formatPrice } from '../../utils/format';
import { Grid, GridSkeleton } from '../components/ProductGrid';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Popular / Trending'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
];
const PAGE_SIZE = 12;

const Group = ({ title, children }) => (
  <fieldset className="border-b border-line py-6 first:pt-0">
    <legend className="label !mb-4 float-left w-full">{title}</legend>
    <div className="clear-both">{children}</div>
  </fieldset>
);

function FilterPanel({ categories, meta, slug, params, update, goCategory }) {
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');
  useEffect(() => { setMin(params.get('minPrice') || ''); setMax(params.get('maxPrice') || ''); }, [params]);

  return (
    <div>
      <Group title="Category">
        <ul className="space-y-1">
          {[{ slug: '', name: 'All products' }, ...(categories || [])].map((c) => {
            const active = (c.slug || '') === (slug || '');
            return (
              <li key={c.slug || 'all'}>
                <button type="button" onClick={() => goCategory(c.slug)} aria-pressed={active} className={`flex w-full items-center justify-between py-1.5 text-left text-sm transition-colors ${active ? 'font-semibold text-gold-deep' : 'text-ink-soft hover:text-ink'}`}>
                  <span>{c.name}</span>{c.productCount != null && <span className="text-xs text-ink-muted">{c.productCount}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      {(meta?.sizes?.length ? meta.sizes : SIZES).length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">
            {(meta?.sizes?.length ? meta.sizes : SIZES).map((s) => {
              const on = params.get('size') === s;
              return <button key={s} type="button" aria-pressed={on} onClick={() => update({ size: on ? '' : s })} className={`h-10 min-w-11 border px-3 text-xs font-semibold transition-colors ${on ? 'border-gold bg-gold-tint text-ink' : 'border-line text-ink hover:border-brand-black'}`}>{s}</button>;
            })}
          </div>
        </Group>
      )}

      {meta?.colors?.length > 0 && (
        <Group title="Color">
          <div className="flex flex-wrap gap-2.5">
            {meta.colors.map((c) => {
              const on = (params.get('color') || '').toLowerCase() === c.name.toLowerCase();
              return (
                <button key={c.name} type="button" title={c.name} aria-label={c.name} aria-pressed={on} onClick={() => update({ color: on ? '' : c.name })} className={`h-9 w-9 rounded-full border p-0.5 transition-all ${on ? 'border-gold shadow-gold' : 'border-line hover:border-brand-black'}`}>
                  <span className="block h-full w-full rounded-full border border-line/60" style={{ backgroundColor: c.hex }} />
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <Group title="Price (₹)">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); update({ minPrice: min, maxPrice: max }); }}>
          <input type="number" min="0" inputMode="numeric" aria-label="Minimum price" placeholder={meta ? String(meta.minPrice) : 'Min'} value={min} onChange={(e) => setMin(e.target.value)} className="field !px-3 !py-2.5" />
          <span className="text-ink-muted">–</span>
          <input type="number" min="0" inputMode="numeric" aria-label="Maximum price" placeholder={meta ? String(meta.maxPrice) : 'Max'} value={max} onChange={(e) => setMax(e.target.value)} className="field !px-3 !py-2.5" />
          <button type="submit" className="btn-dark btn-sm shrink-0">Go</button>
        </form>
      </Group>
    </div>
  );
}

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const { data: categories } = useAsync(() => shopService.categories(), []);
  const { data: meta } = useAsync(() => shopService.meta(), []);

  const query = useMemo(() => ({
    category: slug || '',
    search: params.get('search') || '',
    size: params.get('size') || '',
    color: params.get('color') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
  }), [slug, params]);

  const { data, loading, error, reload } = useAsync(() => shopService.products({ ...query, limit: PAGE_SIZE }), [JSON.stringify(query)]);

  const currentCat = categories?.find((c) => c.slug === slug);
  const title = slug ? currentCat?.name || 'Collection' : query.search ? `Results for “${query.search}”` : 'All products';
  useSEO(slug ? currentCat?.name || 'Shop' : 'Shop', currentCat?.description || 'Browse the full CHOLAN WEAR collection of oversized, regular and custom t-shirts.');

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: false });
  };
  const goCategory = (s) => { navigate({ pathname: s ? `/category/${s}` : '/shop', search: params.toString() ? `?${(() => { const n = new URLSearchParams(params); n.delete('page'); return n.toString(); })()}` : '' }); setDrawer(false); };
  const clearAll = () => navigate(slug ? `/category/${slug}` : '/shop');

  const chips = [
    query.search && ['search', `“${query.search}”`],
    query.size && ['size', `Size ${query.size}`],
    query.color && ['color', query.color],
    (query.minPrice || query.maxPrice) && ['price', `${query.minPrice ? formatPrice(query.minPrice) : '₹0'} – ${query.maxPrice ? formatPrice(query.maxPrice) : 'Any'}`],
  ].filter(Boolean);
  const removeChip = (k) => update(k === 'price' ? { minPrice: '', maxPrice: '' } : { [k]: '' });

  const panel = <FilterPanel categories={categories} meta={meta} slug={slug} params={params} update={update} goCategory={goCategory} />;

  return (
    <>
      <section className="bg-brand-black py-12 text-center sm:py-16">
        <div className="container-page">
          <FadeUp y={12}><nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-brand-white/50">
            <Link to="/" className="hover:text-gold">Home</Link> / <Link to="/shop" className="hover:text-gold">Shop</Link>{currentCat && <> / <span className="text-gold">{currentCat.name}</span></>}
          </nav></FadeUp>
          <FadeUp delay={0.08}><h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide !text-brand-white sm:text-5xl">{title}</h1></FadeUp>
          {currentCat?.description && <p className="mx-auto mt-3 max-w-xl text-sm text-brand-white/60">{currentCat.description}</p>}
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <button className="btn-outline btn-sm lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          <p className="hidden text-sm text-ink-muted lg:block" aria-live="polite">{loading ? 'Loading…' : `${data?.total ?? 0} products`}</p>
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-ink sm:block">Sort by</label>
            <select id="sort" value={query.sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })} className="field !w-auto !py-2.5 pr-8 text-xs">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {chips.map(([k, label]) => (
              <button key={k} onClick={() => removeChip(k)} className="flex items-center gap-1.5 border border-gold bg-gold-tint px-3 py-1.5 text-xs font-semibold text-ink" aria-label={`Remove filter ${label}`}>{label} <X className="h-3 w-3" /></button>
            ))}
            <button onClick={clearAll} className="link-underline ml-1 text-xs font-semibold uppercase tracking-wider text-ink">Clear all</button>
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters"><div className="sticky top-28">{panel}</div></aside>
          <div>
            {loading && <GridSkeleton count={PAGE_SIZE} />}
            {error && <ErrorState message={error} onRetry={reload} />}
            {!loading && !error && data?.products.length === 0 && (
              <EmptyState icon={SearchX} title="No products found" text="Try removing a filter or searching for something else." action={<button onClick={clearAll} className="btn-dark">Clear filters</button>} />
            )}
            {!loading && data?.products.length > 0 && <Grid products={data.products} />}
            {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => { update({ page: p > 1 ? String(p) : '' }); window.scrollTo({ top: 220, behavior: 'smooth' }); }} />}
          </div>
        </div>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filters" side="left" labelledBy="filter-title">
        <div className="p-5">{panel}</div>
        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-surface p-4">
          <button className="btn-outline flex-1" onClick={clearAll}>Reset</button>
          <button className="btn-dark flex-1" onClick={() => setDrawer(false)}>Show {data?.total ?? ''} items</button>
        </div>
      </Modal>
    </>
  );
}
