import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const STATUS_STYLES = {
  Pending: 'border-gold text-gold-deep bg-surface',
  Confirmed: 'border-gold bg-gold-tint text-ink',
  Processing: 'border-gold-dark bg-gold text-brand-black',
  Shipped: 'border-brand-black bg-surface text-ink',
  Delivered: 'border-brand-black bg-brand-black text-brand-white',
  Cancelled: 'border-danger/50 bg-surface text-danger line-through decoration-1',
  Paid: 'border-brand-black bg-brand-black text-brand-white',
  Failed: 'border-danger/50 text-danger bg-surface',
  Refunded: 'border-line text-ink-muted bg-surface-alt',
  COD: 'border-line text-ink bg-surface-alt',
  whatsapp_confirmation: 'border-line text-ink bg-surface-alt',
  Active: 'border-brand-black bg-brand-black text-brand-white',
  Inactive: 'border-line bg-surface-alt text-ink-muted',
};

const STATUS_LABELS = { whatsapp_confirmation: 'WhatsApp' };

export const StatusBadge = ({ status }) => (
  <span className={`inline-block whitespace-nowrap border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLES[status] || STATUS_STYLES.Inactive}`}>{STATUS_LABELS[status] || status}</span>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div>
      <h1 className="heading text-2xl sm:text-3xl">{title}</h1>
      <span className="gold-rule mt-3" />
      {subtitle && <p className="mt-3 text-sm text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export const Card = ({ children, className = '', ...rest }) => (
  <div className={`border border-line bg-surface ${className}`} {...rest}>{children}</div>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search…', label = 'Search' }) => (
  <div className="relative">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
    <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field !pl-10" />
  </div>
);

export const Table = ({ children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
  </div>
);
export const Th = ({ children, className = '' }) => <th scope="col" className={`whitespace-nowrap border-b border-line bg-surface-alt px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }) => <td className={`border-b border-line px-4 py-3 align-middle ${className}`}>{children}</td>;

export const BackLink = ({ to, children }) => (
  <Link to={to} className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-gold-deep">← {children}</Link>
);

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 border transition-colors disabled:opacity-50 ${checked ? 'border-gold bg-gold' : 'border-line bg-surface-alt'}`}>
      <span className={`absolute top-0.5 h-4 w-4 transition-all ${checked ? 'left-[22px] bg-brand-black' : 'left-0.5 bg-ink-muted'}`} />
    </button>
  );
}
