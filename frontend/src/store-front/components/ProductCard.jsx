import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui';
import { useCartStore } from '../../store/cartStore';
import { useWishlist } from '../../store/wishlistStore';
import { assetUrl, formatPrice } from '../../utils/format';
import QuickView from './QuickView';

export default function ProductCard({ product, dark = false }) {
  const [quick, setQuick] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const liked = useWishlist((s) => s.ids.includes(product._id));
  const toggleLike = useWishlist((s) => s.toggle);

  const primary = product.primaryImage || product.images?.[0];
  const second = product.images?.find((i) => i !== primary);
  const soldOut = product.stock <= 0;
  const needsOptions = product.sizes?.length > 0 || product.colors?.length > 1;

  const quickAdd = () => {
    if (needsOptions) return setQuick(true);
    addItem({ productId: product._id, slug: product.slug, name: product.name, size: '', color: product.colors?.[0]?.name || '', quantity: 1, price: product.sellingPrice, image: primary, stock: product.stock });
    toast.success('Added to your cart');
    return undefined;
  };

  return (
    <article className="group relative">
      <div className={`relative aspect-[4/5] overflow-hidden ${dark ? 'bg-surface-darker' : 'bg-surface-alt'}`}>
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="block h-full w-full">
          <img src={assetUrl(primary)} alt={`${product.name} front view`} loading="lazy" decoding="async" className={`h-full w-full object-cover transition-[transform,opacity] duration-[900ms] ease-out will-change-transform ${second ? 'group-hover:scale-[1.03] group-hover:opacity-0' : 'group-hover:scale-105'}`} />
          {second && <img src={assetUrl(second)} alt={`${product.name} alternate view`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-[transform,opacity] duration-[900ms] ease-out will-change-transform group-hover:scale-100 group-hover:opacity-100" />}
        </Link>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100" />

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? <Badge tone="light">Sold out</Badge> : (
            <>
              {product.discountPercent > 0 && <Badge tone="gold">-{product.discountPercent}%</Badge>}
              {product.isNewArrival && <Badge tone="dark">New</Badge>}
              {product.isTrending && <Badge tone="light">Trending</Badge>}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => { toggleLike(product._id); toast(liked ? 'Removed from saved' : 'Saved to wishlist', { icon: liked ? '♡' : '♥' }); }}
          aria-pressed={liked}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-brand-white/90 text-ink transition-colors hover:bg-brand-black hover:text-gold"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-gold text-gold' : ''}`} />
        </button>

        <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-px transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0 max-lg:translate-y-0 max-lg:opacity-100">
          <button type="button" onClick={() => setQuick(true)} aria-label={`Quick view ${product.name}`} className="flex flex-1 items-center justify-center gap-2 bg-brand-white/95 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brand-black hover:text-brand-white">
            <Eye className="h-4 w-4" /> <span className="max-sm:hidden">Quick view</span>
          </button>
          <button type="button" onClick={quickAdd} disabled={soldOut} aria-label={`Add ${product.name} to cart`} className="flex flex-1 items-center justify-center gap-2 bg-brand-black py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-white transition-colors hover:bg-gold hover:text-brand-black disabled:opacity-60">
            <ShoppingBag className="h-4 w-4" /> <span className="max-sm:hidden">{soldOut ? 'Sold out' : 'Add'}</span>
          </button>
        </div>
      </div>

      <div className="pt-4">
        <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${dark ? 'text-brand-white/50' : 'text-ink-muted'}`}>{product.category?.name}</p>
        <h3 className={`mt-1 text-sm font-semibold leading-snug sm:text-[15px] ${dark ? '!text-brand-white' : 'text-ink'}`}>
          <Link to={`/product/${product.slug}`} className={`transition-colors duration-300 ${dark ? 'hover:text-gold' : 'hover:text-gold-deep'}`}>{product.name}</Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-bold sm:text-base ${dark ? 'text-gold' : 'text-gold-deep'}`}>{formatPrice(product.sellingPrice)}</span>
          {product.originalPrice > product.sellingPrice && <span className={`text-xs line-through ${dark ? 'text-brand-white/45' : 'text-ink-muted'}`}>{formatPrice(product.originalPrice)}</span>}
        </p>
      </div>

      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </article>
  );
}
