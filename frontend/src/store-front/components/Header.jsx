import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { EASE } from '../../components/motion';
import { useCartStore, selectCount } from '../../store/cartStore';
import { useSettings } from '../../store/settingsStore';
import { Modal } from '../../components/ui';
import SearchOverlay from './SearchOverlay';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/category/oversized-t-shirts', label: 'Oversized' },
  { to: '/category/regular-t-shirts', label: 'Regular' },
  { to: '/category/customized-t-shirts', label: 'Customized' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function AnnouncementBar() {
  const text = useSettings((s) => s.settings.announcement);
  if (!text) return null;
  return (
    <div className="bg-gold py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-black">
      <div className="container-page">{text}</div>
    </div>
  );
}

export default function Header() {
  const count = useCartStore(selectCount);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const linkCls = ({ isActive }) =>
    `relative py-2 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 ${isActive ? 'text-gold after:w-full' : 'text-brand-white hover:text-gold after:w-0 hover:after:w-full'}`;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${scrolled ? 'bg-brand-black/85 shadow-lift backdrop-blur-md' : 'bg-brand-black'}`}
      >
        <div className={`container-page flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'h-16' : 'h-[72px] sm:h-20'}`}>
          <button className="-ml-2 p-2 text-brand-white transition-colors hover:text-gold lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu}>
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" aria-label="CHOLAN WEAR home" className="shrink-0 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <img src="/logo.png" alt="CHOLAN WEAR" className={`w-auto transition-all duration-300 ${scrolled ? 'h-10' : 'h-11 sm:h-14'}`} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Main">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>)}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => setSearch(true)} aria-label="Search" className="p-2 text-brand-white transition-colors hover:text-gold"><Search className="h-5 w-5" /></button>
            <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative p-2 text-brand-white transition-colors hover:text-gold">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-gold px-1 text-[10px] font-bold text-brand-black">{count}</span>}
            </Link>
          </div>
        </div>
      </motion.header>

      <Modal open={menu} onClose={() => setMenu(false)} title="Menu" side="left" labelledBy="menu-title">
        <nav className="flex flex-col p-2" aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `border-b border-line px-4 py-4 font-display text-lg uppercase tracking-wide ${isActive ? 'text-gold-deep' : 'text-ink'}`}>{n.label}</NavLink>
          ))}
        </nav>
      </Modal>
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
