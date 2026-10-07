import { Link } from 'react-router-dom';
import { Modal } from '../../components/ui';
import { assetUrl, formatPrice } from '../../utils/format';
import ProductOptions from './ProductOptions';

export default function QuickView({ product, onClose }) {
  const img = product.primaryImage || product.images?.[0];
  return (
    <Modal open onClose={onClose} title="Quick view" wide labelledBy="qv-title">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="aspect-[4/5] bg-surface-alt md:aspect-auto">
          <img src={assetUrl(img)} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="eyebrow">{product.category?.name}</p>
          <h3 id="qv-title" className="heading mt-2 text-xl normal-case sm:text-2xl">{product.name}</h3>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gold-deep">{formatPrice(product.sellingPrice)}</span>
            {product.originalPrice > product.sellingPrice && <span className="text-sm text-ink-muted line-through">{formatPrice(product.originalPrice)}</span>}
          </p>
          {product.shortDescription && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>}
          <ProductOptions product={product} onAdded={onClose} />
          <Link to={`/product/${product.slug}`} onClick={onClose} className="link-underline mt-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-ink">View full details</Link>
        </div>
      </div>
    </Modal>
  );
}
