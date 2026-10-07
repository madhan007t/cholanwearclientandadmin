import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FadeUp, Reveal } from '../motion';
import { AlertTriangle, Loader2, Minus, Plus, X, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
import { useEscape, useLockBodyScroll } from '../../hooks';

/* ---------- loaders ---------- */
export function BrandLoader({ label = 'Loading', fullscreen = false }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-5 ${fullscreen ? 'min-h-screen bg-brand-black' : 'py-24'}`}>
      <img src="/logo.png" alt="CHOLAN WEAR" className={`w-44 animate-pulse-gold ${fullscreen ? '' : 'invert-0'}`} style={fullscreen ? undefined : { filter: 'none' }} />
      <span className="h-px w-24 overflow-hidden bg-gold/30">
        <span className="block h-full w-full origin-left animate-pulse-gold bg-gold" />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export const Spinner = ({ className = 'h-4 w-4' }) => <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;

export const Skeleton = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-surface-alt ${className}`} aria-hidden="true">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-brand-white/70 to-transparent" />
  </div>
);

export const ProductCardSkeleton = () => (
  <div>
    <Skeleton className="aspect-[4/5] w-full" />
    <Skeleton className="mt-4 h-3 w-1/3" />
    <Skeleton className="mt-2 h-4 w-3/4" />
    <Skeleton className="mt-2 h-4 w-1/2" />
  </div>
);

/* ---------- button with loading state ---------- */
export function Button({ variant = 'dark', loading = false, disabled, children, className = '', size, as: Tag = 'button', ...rest }) {
  const cls = `btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`;
  return (
    <Tag className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner />}
      {children}
    </Tag>
  );
}

/* ---------- states ---------- */
export function EmptyState({ icon: Icon = PackageOpen, title, text, action, dark = false }) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <span className={`mb-5 flex h-16 w-16 items-center justify-center border ${dark ? 'border-line-dark text-gold' : 'border-line text-gold-deep'}`}>
        <Icon className="h-7 w-7" strokeWidth={1.4} />
      </span>
      <h3 className="heading text-lg">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-16 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center border border-danger/40 text-danger">
        <AlertTriangle className="h-7 w-7" strokeWidth={1.4} />
      </span>
      <h3 className="heading text-lg">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-dark mt-6">Try again</button>}
    </div>
  );
}

/* ---------- form bits ---------- */
export function Field({ label, error, hint, required, children, htmlFor, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-gold-deep" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p className="err-text" role="alert">{error}</p>}
    </div>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 10, size = 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  return (
    <div className={`inline-flex ${h} items-stretch border border-line`} role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)} className="w-10 text-ink transition-colors hover:bg-brand-black hover:text-brand-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
        <Minus className="mx-auto h-3.5 w-3.5" />
      </button>
      <span className="flex w-10 items-center justify-center text-sm font-semibold text-ink" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} className="w-10 text-ink transition-colors hover:bg-brand-black hover:text-brand-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
        <Plus className="mx-auto h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export const Badge = ({ children, tone = 'dark', className = '' }) => {
  const tones = {
    dark: 'bg-brand-black text-brand-white',
    gold: 'bg-gold text-brand-black',
    light: 'bg-brand-white text-ink border border-line',
    outline: 'border border-gold text-gold-deep',
  };
  return <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tones[tone]} ${className}`}>{children}</span>;
};

/* ---------- modal / drawer ---------- */
export function Modal({ open, onClose, title, children, wide = false, side = null, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useLockBodyScroll(open);
  useEscape(onClose, open);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;

  const panel = side
    ? `fixed inset-y-0 ${side === 'right' ? 'right-0 animate-slide-right' : 'left-0 animate-slide-left'} w-full max-w-md`
    : `relative m-auto w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} animate-fade-up`;

  // Rendered in a portal so animated ancestors (transforms) can never break `position: fixed`.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-brand-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={`${panel} max-h-full overflow-y-auto bg-surface shadow-lift outline-none`}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
            <h2 id={labelledBy} className="heading text-base">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="p-1 text-ink transition-colors hover:text-gold-deep"><X className="h-5 w-5" /></button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} labelledBy="confirm-title">
      <div className="p-6">
        <p className="text-sm text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
          <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- pagination ---------- */
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i += 1) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  const base = 'flex h-10 min-w-10 items-center justify-center border px-3 text-xs font-semibold transition-colors';
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <button aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} className={`${base} border-line hover:border-gold disabled:opacity-30`}><ChevronLeft className="h-4 w-4" /></button>
      {out.map((n) => typeof n === 'string' ? <span key={n} className="px-1 text-ink-muted">…</span> : (
        <button key={n} aria-current={n === page ? 'page' : undefined} onClick={() => onChange(n)} className={`${base} ${n === page ? 'border-brand-black bg-brand-black text-brand-white' : 'border-line text-ink hover:border-gold'}`}>{n}</button>
      ))}
      <button aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)} className={`${base} border-line hover:border-gold disabled:opacity-30`}><ChevronRight className="h-4 w-4" /></button>
    </nav>
  );
}

export const SectionHeading = ({ eyebrow, title, subtitle, link, linkLabel = 'View all', dark = false }) => (
  <div className="mb-8 flex items-end justify-between gap-4 sm:mb-12">
    <div>
      {eyebrow && <FadeUp y={14}><p className={dark ? 'eyebrow-dark' : 'eyebrow'}>{eyebrow}</p></FadeUp>}
      <Reveal delay={0.05}><h2 className={`heading mt-2 pb-1 text-2xl sm:text-4xl ${dark ? '!text-brand-white' : ''}`}>{title}</h2></Reveal>
      {subtitle && <FadeUp y={14} delay={0.15}><p className={`mt-2 max-w-md text-sm sm:text-base ${dark ? 'text-brand-white/65' : 'text-ink-muted'}`}>{subtitle}</p></FadeUp>}
      <FadeUp y={0} delay={0.2}><span className="gold-rule mt-4" /></FadeUp>
    </div>
    {link && <Link to={link} className={`link-underline hidden shrink-0 text-xs font-semibold uppercase tracking-[0.18em] sm:block ${dark ? 'text-brand-white' : 'text-ink'}`}>{linkLabel}</Link>}
  </div>
);
