import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, ImagePlus, Star, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { assetUrl } from '../../utils/format';
import { Spinner } from '../../components/ui';

const MAX_MB = 5;
const OK = ['image/jpeg', 'image/png', 'image/webp'];
const LABELS = ['Main / Front', 'Back'];

/**
 * images: ordered array of URLs (first = primary). Uploads go to the backend immediately after a
 * local preview is shown; only URLs (never base64) are stored with the product.
 */
export default function ImageManager({ images, onChange, max = 12, folder = 'products' }) {
  const input = useRef(null);
  const [pending, setPending] = useState([]); // local blob previews while uploading
  const [drag, setDrag] = useState(false);

  const upload = async (fileList) => {
    const files = [...fileList];
    const room = max - images.length;
    if (room <= 0) return toast.error(`Maximum ${max} images`);
    const valid = [];
    for (const f of files.slice(0, room)) {
      if (!OK.includes(f.type)) toast.error(`${f.name}: only JPG, PNG or WEBP`);
      else if (f.size > MAX_MB * 1024 * 1024) toast.error(`${f.name}: larger than ${MAX_MB}MB`);
      else valid.push(f);
    }
    if (files.length > room) toast(`Only ${room} more image(s) allowed`);
    if (!valid.length) return undefined;

    const previews = valid.map((f) => URL.createObjectURL(f));
    setPending((p) => [...p, ...previews]);
    try {
      const urls = await adminService.upload(valid, folder);
      onChange([...images, ...urls]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPending((p) => p.filter((u) => !previews.includes(u)));
      if (input.current) input.current.value = '';
    }
    return undefined;
  };

  const move = (i, d) => {
    const next = [...images];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const makePrimary = (i) => onChange([images[i], ...images.filter((_, k) => k !== i)]);
  const remove = (i) => onChange(images.filter((_, k) => k !== i));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <figure key={src} className={`group relative border-2 bg-surface-alt ${i === 0 ? 'border-gold' : 'border-line'}`}>
            <img src={assetUrl(src)} alt={`Product image ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
            <figcaption className="absolute left-0 top-0 bg-brand-black px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">{i === 0 ? 'Primary' : LABELS[i] || `Extra ${i - 1}`}</figcaption>
            <button type="button" onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-brand-black text-brand-white transition-colors hover:bg-danger"><X className="h-4 w-4" /></button>
            <div className="flex border-t border-line bg-surface">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="flex-1 py-2 text-ink hover:bg-surface-alt disabled:opacity-30"><ArrowLeft className="mx-auto h-4 w-4" /></button>
              <button type="button" disabled={i === 0} onClick={() => makePrimary(i)} aria-label="Set as primary image" title="Set as primary" className="flex-1 border-x border-line py-2 text-gold-deep hover:bg-gold-tint disabled:opacity-30"><Star className={`mx-auto h-4 w-4 ${i === 0 ? 'fill-gold' : ''}`} /></button>
              <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="flex-1 py-2 text-ink hover:bg-surface-alt disabled:opacity-30"><ArrowRight className="mx-auto h-4 w-4" /></button>
            </div>
          </figure>
        ))}
        {pending.map((u) => (
          <div key={u} className="relative border-2 border-dashed border-gold bg-surface-alt">
            <img src={u} alt="Uploading preview" className="aspect-[4/5] w-full object-cover opacity-50" />
            <span className="absolute inset-0 flex items-center justify-center"><Spinner className="h-6 w-6 text-gold-deep" /></span>
          </div>
        ))}
        {images.length + pending.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
            className={`flex aspect-[4/5] flex-col items-center justify-center gap-2 border-2 border-dashed px-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${drag ? 'border-gold bg-gold-tint' : 'border-line text-ink-muted hover:border-gold hover:text-ink'}`}
          >
            <ImagePlus className="h-7 w-7 text-gold-deep" strokeWidth={1.4} /> Add images
            <span className="font-normal normal-case tracking-normal">JPG, PNG, WEBP · max {MAX_MB}MB</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files)} aria-label="Upload product images" />
      <p className="mt-3 text-xs text-ink-muted">The first image is the primary image shown in listings. Use the arrows to reorder (e.g. Front, Back, then extras) and the star to set the primary.</p>
    </div>
  );
}
