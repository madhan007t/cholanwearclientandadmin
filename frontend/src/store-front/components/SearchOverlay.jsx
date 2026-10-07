import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDebounce, useEscape, useLockBodyScroll } from '../../hooks';
import { shopService } from '../../services/shopService';
import { assetUrl, formatPrice } from '../../utils/format';

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const debounced = useDebounce(q.trim(), 300);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useLockBodyScroll(open);
  useEscape(onClose, open);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); else { setQ(''); setResults(null); } }, [open]);

  useEffect(() => {
    if (!open || debounced.length < 2) { setResults(null); return undefined; }
    let live = true;
    setBusy(true);
    shopService.products({ search: debounced, limit: 6 })
      .then((d) => live && setResults(d))
      .catch(() => live && setResults({ products: [], total: 0 }))
      .finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [debounced, open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] animate-fade-in bg-brand-black/95" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="container-page pt-6 sm:pt-10">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Close search" className="p-2 text-brand-white transition-colors hover:text-gold"><X className="h-7 w-7" /></button>
        </div>
        <form onSubmit={submit} className="mx-auto mt-4 max-w-3xl" role="search">
          <label htmlFor="site-search" className="eyebrow-dark">Search CHOLAN WEAR</label>
          <div className="mt-3 flex items-center gap-3 border-b-2 border-gold pb-3">
            <Search className="h-6 w-6 text-gold" />
            <input id="site-search" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or categories…" autoComplete="off" className="w-full bg-transparent font-display text-xl tracking-wide text-brand-white placeholder:text-brand-white/40 focus:outline-none sm:text-3xl" />
          </div>
        </form>

        <div className="mx-auto mt-8 max-w-3xl pb-10">
          {busy && <p className="text-sm text-brand-white/60">Searching…</p>}
          {results && !busy && results.products.length === 0 && <p className="text-sm text-brand-white/70">No products found for “{debounced}”. Try another word.</p>}
          {results && results.products.length > 0 && (
            <>
              <ul className="divide-y divide-line-dark">
                {results.products.map((p) => (
                  <li key={p._id}>
                    <Link to={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 py-3 text-brand-white transition-colors hover:text-gold">
                      <img src={assetUrl(p.primaryImage || p.images?.[0])} alt="" className="h-16 w-14 bg-surface-darker object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="text-xs text-brand-white/60">{p.category?.name}</span>
                      </span>
                      <span className="text-sm font-semibold text-gold">{formatPrice(p.sellingPrice)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {results.total > results.products.length && (
                <button onClick={submit} className="btn-outline-light mt-6">See all {results.total} results</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
