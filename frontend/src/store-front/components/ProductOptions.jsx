import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { QuantityStepper } from '../../components/ui';
import { useCartStore } from '../../store/cartStore';
import { MAX_QTY_PER_LINE } from '../../utils/format';

/** Size / colour / quantity selectors + Add to cart / Buy now. Shared by PDP and Quick View. */
export default function ProductOptions({ product, onAdded }) {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const hasSizes = product.sizes?.length > 0;
  const hasColors = product.colors?.length > 0;
  const [size, setSize] = useState(product.sizes?.length === 1 ? product.sizes[0] : '');
  const [color, setColor] = useState(product.colors?.length === 1 ? product.colors[0].name : '');
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});

  const soldOut = product.stock <= 0;
  const maxQty = Math.min(MAX_QTY_PER_LINE, product.stock || 1);

  const validate = () => {
    const e = {};
    if (hasSizes && !size) e.size = 'Please select a size';
    if (hasColors && product.colors.length > 1 && !color) e.color = 'Please select a color';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const add = () => {
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      size,
      color: color || (hasColors ? product.colors[0].name : ''),
      quantity: qty,
      price: product.sellingPrice,
      image: product.primaryImage || product.images?.[0] || '',
      stock: product.stock,
    });
  };

  const handleAdd = () => {
    if (!validate()) return;
    add();
    toast.success('Added to your cart');
    onAdded?.();
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    add();
    onAdded?.();
    navigate('/checkout');
  };

  return (
    <div>
      {hasSizes && (
        <fieldset className="mt-6">
          <legend className="label flex w-full justify-between">
            <span>Size {size && <span className="font-normal normal-case tracking-normal text-ink-muted">- {size}</span>}</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => { setSize(s); setErrors((e) => ({ ...e, size: undefined })); }}
                className={`h-11 min-w-12 border px-4 text-xs font-semibold tracking-wider transition-colors ${size === s ? 'border-gold bg-gold-tint text-ink shadow-gold' : 'border-line text-ink hover:border-brand-black'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.size && <p className="err-text" role="alert">{errors.size}</p>}
        </fieldset>
      )}

      {hasColors && (
        <fieldset className="mt-6">
          <legend className="label">Color {color && <span className="font-normal normal-case tracking-normal text-ink-muted">- {color}</span>}</legend>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={color === c.name}
                aria-label={c.name}
                title={c.name}
                onClick={() => { setColor(c.name); setErrors((e) => ({ ...e, color: undefined })); }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border p-0.5 transition-all ${color === c.name ? 'border-gold shadow-gold' : 'border-line hover:border-brand-black'}`}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full border border-line/60" style={{ backgroundColor: c.hex }}>
                  {color === c.name && <Check className="h-4 w-4 text-gold" strokeWidth={3} />}
                </span>
              </button>
            ))}
          </div>
          {errors.color && <p className="err-text" role="alert">{errors.color}</p>}
        </fieldset>
      )}

      <div className="mt-6">
        <span className="label">Quantity</span>
        <QuantityStepper value={qty} onChange={setQty} max={maxQty} />
        {!soldOut && product.stock <= 5 && <p className="mt-2 text-xs font-semibold text-gold-deep">Only {product.stock} left in stock</p>}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button type="button" className="btn-outline py-4" onClick={handleAdd} disabled={soldOut}>{soldOut ? 'Sold out' : 'Add to cart'}</button>
        <button type="button" className="btn-gold py-4" onClick={handleBuyNow} disabled={soldOut}>Buy now</button>
      </div>
    </div>
  );
}
