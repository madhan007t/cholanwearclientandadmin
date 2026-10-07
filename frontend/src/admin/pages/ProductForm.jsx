import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { BrandLoader, Button, ErrorState, Field } from '../../components/ui';
import { SIZES, slugify } from '../../utils/format';
import { BackLink, Card, PageHeader, Toggle } from '../components/shared';
import ImageManager from '../components/ImageManager';

const blank = {
  name: '', slug: '', sku: '', category: '', shortDescription: '', description: '',
  sellingPrice: '', originalPrice: '', stock: '0', sizes: ['S', 'M', 'L', 'XL'], colors: [],
  images: [], fabric: '', fit: '', washCare: '',
  isTrending: false, isNewArrival: false, isBestSeller: false, isActive: true,
};

const Section = ({ title, children }) => (
  <Card className="p-5 sm:p-6"><h2 className="heading text-base">{title}</h2><span className="gold-rule mt-3" /><div className="mt-6">{children}</div></Card>
);

export default function ProductForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  useSEO(editing ? 'Edit product' : 'Add product');

  const { data: cats, loading: catsLoading } = useAsync(() => adminService.categories(), []);
  const { data: existing, loading, error, reload } = useAsync(() => (editing ? adminService.product(id) : Promise.resolve(null)), [id]);

  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [color, setColor] = useState({ name: '', hex: '#000000' });

  useEffect(() => {
    if (existing) {
      setForm({
        ...blank, ...existing,
        category: existing.category?._id || existing.category || '',
        sellingPrice: String(existing.sellingPrice ?? ''), originalPrice: existing.originalPrice ? String(existing.originalPrice) : '',
        stock: String(existing.stock ?? 0), sku: existing.sku || '',
        images: existing.primaryImage ? [existing.primaryImage, ...existing.images.filter((i) => i !== existing.primaryImage)] : existing.images || [],
      });
      setSlugTouched(true);
    }
  }, [existing]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const onName = (v) => setForm((f) => ({ ...f, name: v, ...(slugTouched ? {} : { slug: slugify(v) }) }));
  const toggleSize = (s) => set('sizes', form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : SIZES.filter((x) => [...form.sizes, s].includes(x)));

  const addColor = () => {
    const name = color.name.trim();
    if (!name) return toast.error('Enter a color name');
    if (form.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return toast.error('That color is already added');
    set('colors', [...form.colors, { name, hex: color.hex }]);
    setColor({ name: '', hex: '#000000' });
    return undefined;
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Product name is required';
    if (!form.category) e.category = 'Choose a category';
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) e.sellingPrice = 'Enter the selling price';
    if (form.originalPrice !== '' && Number(form.originalPrice) < Number(form.sellingPrice)) e.originalPrice = 'Must be at least the selling price';
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Stock must be a whole number';
    if (form.images.length === 0) e.images = 'Upload at least one image';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (saving) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error('Please fix the highlighted fields');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        sellingPrice: Number(form.sellingPrice),
        originalPrice: form.originalPrice === '' ? 0 : Number(form.originalPrice),
        stock: Number(form.stock),
        primaryImage: form.images[0] || '',
      };
      delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt; delete body.id; delete body.discountPercent; delete body.soldCount;
      if (editing) await adminService.updateProduct(id, body); else await adminService.createProduct(body);
      toast.success(editing ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if ((editing && loading) || catsLoading) return <BrandLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const inp = (k, label, props = {}) => {
    const { className, required, ...rest } = props;
    return (
      <Field label={label} error={errors[k]} required={required} htmlFor={`p-${k}`} className={className}>
        <input id={`p-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} className={`field ${errors[k] ? 'field-error' : ''}`} {...rest} />
      </Field>
    );
  };

  return (
    <>
      <BackLink to="/admin/products">All products</BackLink>
      <PageHeader title={editing ? 'Edit product' : 'Add product'} subtitle={editing ? form.name : 'Fill in the details and upload images.'} />

      <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Basic information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" required error={errors.name} htmlFor="p-name" className="sm:col-span-2"><input id="p-name" value={form.name} onChange={(e) => onName(e.target.value)} aria-invalid={!!errors.name} className={`field ${errors.name ? 'field-error' : ''}`} maxLength={140} /></Field>
              <Field label="Product slug" error={errors.slug} hint={`URL: /product/${form.slug || 'product-slug'}`} htmlFor="p-slug"><input id="p-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} className="field" /></Field>
              {inp('sku', 'SKU', { maxLength: 40 })}
              <Field label="Category" required error={errors.category} htmlFor="p-category" className="sm:col-span-2">
                <select id="p-category" value={form.category} onChange={(e) => set('category', e.target.value)} aria-invalid={!!errors.category} className={`field ${errors.category ? 'field-error' : ''}`}>
                  <option value="">Select a category…</option>{cats?.map((c) => <option key={c._id} value={c._id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>)}
                </select>
              </Field>
              <Field label="Short description" className="sm:col-span-2" htmlFor="p-short"><input id="p-short" maxLength={300} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className="field" /></Field>
              <Field label="Full description" className="sm:col-span-2" htmlFor="p-desc"><textarea id="p-desc" rows={6} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} className="field" /></Field>
            </div>
          </Section>

          <Section title="Pricing & stock">
            <div className="grid gap-4 sm:grid-cols-3">
              {inp('sellingPrice', 'Selling price (₹)', { type: 'number', min: 0, step: '1', inputMode: 'decimal', required: true })}
              {inp('originalPrice', 'Original price (₹)', { type: 'number', min: 0, step: '1', inputMode: 'decimal', placeholder: 'For discount display' })}
              {inp('stock', 'Stock', { type: 'number', min: 0, step: '1', inputMode: 'numeric' })}
            </div>
          </Section>

          <Section title="Sizes & colors">
            <fieldset>
              <legend className="label">Available sizes</legend>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <label key={s} className={`flex h-11 min-w-14 cursor-pointer items-center justify-center gap-2 border px-4 text-xs font-semibold transition-colors ${form.sizes.includes(s) ? 'border-gold bg-gold-tint' : 'border-line hover:border-brand-black'}`}>
                    <input type="checkbox" className="sr-only" checked={form.sizes.includes(s)} onChange={() => toggleSize(s)} />{s}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">Leave all unchecked for one-size products. Customers can only choose sizes selected here.</p>
            </fieldset>

            <fieldset className="mt-8">
              <legend className="label">Available colors</legend>
              {form.colors.length > 0 && (
                <ul className="mb-4 flex flex-wrap gap-2">
                  {form.colors.map((c) => (
                    <li key={c.name} className="flex items-center gap-2 border border-line bg-surface-alt py-1.5 pl-2 pr-1 text-xs">
                      <span className="h-5 w-5 border border-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />{c.name}
                      <button type="button" aria-label={`Remove ${c.name}`} onClick={() => set('colors', form.colors.filter((x) => x.name !== c.name))} className="p-1 text-ink-muted hover:text-danger"><X className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[160px] flex-1"><label htmlFor="c-name" className="label">Color name</label><input id="c-name" value={color.name} maxLength={40} onChange={(e) => setColor({ ...color, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="e.g. Black" className="field" /></div>
                <div><label htmlFor="c-hex" className="label">Hex</label><input id="c-hex" type="color" value={color.hex} onChange={(e) => setColor({ ...color, hex: e.target.value })} className="h-[46px] w-16 cursor-pointer border border-line bg-surface p-1" /></div>
                <button type="button" onClick={addColor} className="btn-dark"><Plus className="h-4 w-4" /> Add color</button>
              </div>
            </fieldset>
          </Section>

          <Section title="Images">
            <ImageManager images={form.images} onChange={(imgs) => set('images', imgs)} />
            {errors.images && <p className="err-text" role="alert">{errors.images}</p>}
          </Section>

          <Section title="Product details">
            <div className="grid gap-4 sm:grid-cols-2">
              {inp('fabric', 'Fabric', { placeholder: 'e.g. 240 GSM combed cotton', maxLength: 200 })}
              {inp('fit', 'Fit', { placeholder: 'e.g. Oversized / drop shoulder', maxLength: 200 })}
              {inp('washCare', 'Wash care', { className: 'sm:col-span-2', maxLength: 300, placeholder: 'e.g. Machine wash cold, inside out' })}
            </div>
          </Section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5">
            <h2 className="heading text-base">Visibility</h2>
            <ul className="mt-5 space-y-4">
              {[['isActive', 'Active', 'Visible in the store'], ['isTrending', 'Trending', 'Shown in “Trending now”'], ['isNewArrival', 'New arrival', 'Shown in “New arrivals”'], ['isBestSeller', 'Best seller', 'Shown in “Best sellers”']].map(([k, l, d]) => (
                <li key={k} className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{l}</p><p className="text-xs text-ink-muted">{d}</p></div><Toggle checked={form[k]} onChange={(v) => set(k, v)} label={l} /></li>
              ))}
            </ul>
          </Card>
          <div className="flex gap-3">
            <button type="button" className="btn-outline flex-1" onClick={() => navigate('/admin/products')} disabled={saving}>Cancel</button>
            <Button type="submit" variant="gold" className="flex-1" loading={saving}>{editing ? 'Save changes' : 'Create product'}</Button>
          </div>
        </aside>
      </form>
    </>
  );
}
