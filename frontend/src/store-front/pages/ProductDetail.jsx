import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { shopService } from '../../services/shopService';
import { useSettings } from '../../store/settingsStore';
import { FadeIn, FadeUp } from '../../components/motion';
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { assetUrl, formatPrice } from '../../utils/format';
import ProductOptions from '../components/ProductOptions';
import ProductSection from '../components/ProductGrid';

function Gallery({ product }) {
  const imgs = product.images?.length ? product.images : [product.primaryImage].filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [product._id]);
  const go = (d) => setI((v) => (v + d + imgs.length) % imgs.length);
  const labels = ['Front', 'Back'];

  return (
    <div className="grid gap-3 md:grid-cols-[84px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col no-scrollbar" role="tablist" aria-label="Product images">
        {imgs.map((src, idx) => (
          <button key={src} role="tab" aria-selected={i === idx} aria-label={`View image ${idx + 1}`} onClick={() => setI(idx)} className={`aspect-[4/5] w-16 shrink-0 overflow-hidden border-2 transition-colors md:w-full ${i === idx ? 'border-gold' : 'border-transparent hover:border-line'}`}>
            <img src={assetUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-[4/5] overflow-hidden bg-surface-alt md:order-2">
        <img key={imgs[i]} src={assetUrl(imgs[i])} alt={`${product.name} - ${labels[i] || `view ${i + 1}`}`} className="h-full w-full animate-fade-in object-cover" fetchPriority="high" />
        {imgs.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-brand-white/90 text-ink transition-colors hover:bg-brand-black hover:text-gold"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-brand-white/90 text-ink transition-colors hover:bg-brand-black hover:text-gold"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
        {product.discountPercent > 0 && <div className="absolute left-3 top-3"><Badge tone="gold">-{product.discountPercent}%</Badge></div>}
      </div>
    </div>
  );
}

function Details({ product }) {
  const rows = [['Fabric', product.fabric], ['Fit', product.fit], ['Wash care', product.washCare]].filter(([, v]) => v);
  const settings = useSettings((s) => s.settings);
  const [open, setOpen] = useState('details');
  const Item = ({ id, title, children }) => (
    <div className="border-b border-line">
      <h3>
        <button type="button" aria-expanded={open === id} onClick={() => setOpen(open === id ? '' : id)} className="flex w-full items-center justify-between py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink">
          {title}<span className="text-lg text-gold-deep">{open === id ? '−' : '+'}</span>
        </button>
      </h3>
      {open === id && <div className="pb-5 text-sm leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
  return (
    <div className="mt-10 border-t border-line">
      <Item id="details" title="Product details">
        {product.description ? <p className="whitespace-pre-line">{product.description}</p> : <p>No additional details.</p>}
        {rows.length > 0 && (
          <dl className="mt-4 space-y-2">
            {rows.map(([k, v]) => (<div key={k} className="grid grid-cols-[110px_1fr]"><dt className="font-semibold text-ink">{k}</dt><dd>{v}</dd></div>))}
          </dl>
        )}
        {product.sku && <p className="mt-4 text-xs text-ink-muted">SKU: {product.sku}</p>}
      </Item>
      <Item id="delivery" title="Delivery information">
        <p>Delivery charge: {settings.deliveryCharge > 0 ? formatPrice(settings.deliveryCharge) : 'Free'}{settings.freeDeliveryAbove > 0 && <> · Free on orders above {formatPrice(settings.freeDeliveryAbove)}</>}.</p>
        <p className="mt-2">Orders are dispatched within 1–2 business days and usually arrive in 4–7 days. Pay cash on delivery.</p>
      </Item>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, loading, error, reload } = useAsync(() => shopService.product(slug), [slug]);
  useSEO(product ? product.name : 'Product', product?.shortDescription || product?.description || undefined);

  if (loading) {
    return (
      <div className="container-page grid gap-10 py-10 md:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <div className="space-y-4"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-24" /><Skeleton className="h-12" /></div>
      </div>
    );
  }
  if (error) {
    const notFound = /not found/i.test(error);
    return notFound
      ? <EmptyState title="Product not found" text="This product may have been removed or is no longer available." action={<Link to="/shop" className="btn-dark">Back to shop</Link>} />
      : <ErrorState message={error} onRetry={reload} />;
  }

  return (
    <>
      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <Link to="/" className="hover:text-gold-deep">Home</Link> / <Link to="/shop" className="hover:text-gold-deep">Shop</Link>
          {product.category && <> / <Link to={`/category/${product.category.slug}`} className="hover:text-gold-deep">{product.category.name}</Link></>}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <FadeIn><Gallery product={product} /></FadeIn>
          <FadeUp y={20} delay={0.1} className="lg:pt-2">
            <p className="eyebrow">{product.category?.name}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide sm:text-4xl">{product.name}</h1>

            <p className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-gold-deep">{formatPrice(product.sellingPrice)}</span>
              {product.originalPrice > product.sellingPrice && (
                <>
                  <span className="text-lg text-ink-muted line-through">{formatPrice(product.originalPrice)}</span>
                  <Badge tone="gold">Save {product.discountPercent}%</Badge>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>

            {product.shortDescription && <p className="mt-5 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>}

            <ProductOptions key={product._id} product={product} />

            <ul className="mt-8 grid gap-3 text-xs text-ink-soft sm:grid-cols-3">
              {[[Truck, 'Cash on delivery'], [ShieldCheck, 'Premium quality'], [RotateCcw, 'Easy support']].map(([Icon, t]) => (
                <li key={t} className="flex items-center gap-2 border border-line px-3 py-3"><Icon className="h-4 w-4 text-gold-deep" /> {t}</li>
              ))}
            </ul>
            <Details product={product} />
          </FadeUp>
        </div>
      </div>

      {product.category && (
        <ProductSection eyebrow="You may also like" title="Related products" params={{ category: product.category.slug, exclude: product._id }} limit={4} alt />
      )}
    </>
  );
}
