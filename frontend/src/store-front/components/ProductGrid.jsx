import { useAsync } from '../../hooks';
import { shopService } from '../../services/shopService';
import { SectionHeading, ProductCardSkeleton, ErrorState } from '../../components/ui';
import { StaggerContainer, StaggerItem } from '../../components/motion';
import ProductCard from './ProductCard';

export const gridCls = 'grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14';

/** Cards fade up one after another as the grid enters the viewport. */
export function Grid({ products, dark = false }) {
  return (
    <StaggerContainer className={gridCls} stagger={0.07}>
      {products.map((p) => (
        <StaggerItem key={p._id}><ProductCard product={p} dark={dark} /></StaggerItem>
      ))}
    </StaggerContainer>
  );
}

export function GridSkeleton({ count = 8 }) {
  return <div className={gridCls}>{Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}</div>;
}

/**
 * A titled, self-fetching product section (Trending / New / Best sellers / Related).
 * tone: 'white' | 'alt' | 'dark' - sections alternate between white and black.
 */
export default function ProductSection({ eyebrow, title, subtitle, params, link, limit = 4, tone = 'white', hideWhenEmpty = true }) {
  const { data, loading, error, reload } = useAsync(() => shopService.products({ ...params, limit }), [JSON.stringify(params), limit]);
  if (!loading && !error && hideWhenEmpty && !data?.products?.length) return null;
  const dark = tone === 'dark';
  return (
    <section className={`section ${dark ? 'bg-brand-black' : tone === 'alt' ? 'bg-surface-alt' : ''}`}>
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} link={link} dark={dark} />
        {loading && <GridSkeleton count={limit} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && <Grid products={data.products} dark={dark} />}
      </div>
    </section>
  );
}
