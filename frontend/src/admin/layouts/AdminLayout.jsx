import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, PlusSquare, Tags, ClipboardList, Users, Settings, LogOut, Menu, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../store/adminAuthStore';
import { BrandLoader, Modal } from '../../components/ui';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: true },
  { to: '/admin/products/new', label: 'Add Product', icon: PlusSquare },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarNav({ onNavigate, onLogout, admin }) {
  return (
    <div className="flex h-full flex-col bg-brand-black text-brand-white">
      <div className="border-b border-line-dark px-6 py-6">
        <Link to="/admin" onClick={onNavigate}><img src="/logo.png" alt="CHOLAN WEAR" className="h-11 w-auto" /></Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-white/50">Admin panel</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `flex items-center gap-3 border-l-2 px-4 py-3 text-[13px] font-medium transition-colors ${isActive ? 'border-gold bg-surface-darker text-gold' : 'border-transparent text-brand-white/75 hover:bg-surface-darker hover:text-brand-white'}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line-dark p-4">
        <a href="/" target="_blank" rel="noopener noreferrer" className="mb-3 flex items-center gap-2 px-2 text-xs text-brand-white/60 hover:text-gold"><ExternalLink className="h-3.5 w-3.5" /> View store</a>
        <div className="mb-3 truncate px-2 text-xs text-brand-white/60" title={admin?.email}>{admin?.name}<br /><span className="text-brand-white/40">{admin?.email}</span></div>
        <button onClick={onLogout} className="flex w-full items-center gap-3 border border-line-dark px-4 py-2.5 text-[13px] text-brand-white transition-colors hover:border-gold hover:text-gold"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { admin, status, bootstrap, logout, clear } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { if (status === 'idle') bootstrap(); }, [status, bootstrap]);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onUnauth = () => { clear(); toast.error('Your session expired. Please log in again.'); };
    window.addEventListener('cw:admin-unauthorized', onUnauth);
    return () => window.removeEventListener('cw:admin-unauthorized', onUnauth);
  }, [clear]);

  if (status === 'idle' || status === 'loading') return <BrandLoader fullscreen label="Checking session" />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;

  const doLogout = async () => { await logout(); navigate('/admin/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-surface-alt lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><SidebarNav admin={admin} onLogout={doLogout} /></aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-black px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 text-brand-white"><Menu className="h-6 w-6" /></button>
        <img src="/logo.png" alt="CHOLAN WEAR admin" className="h-9 w-auto" />
        <button onClick={doLogout} aria-label="Logout" className="p-1 text-brand-white hover:text-gold"><LogOut className="h-5 w-5" /></button>
      </header>
      <Modal open={open} onClose={() => setOpen(false)} title="Menu" side="left">
        <div className="h-[calc(100vh-61px)]"><SidebarNav admin={admin} onNavigate={() => setOpen(false)} onLogout={doLogout} /></div>
      </Modal>

      <main className="p-4 sm:p-6 lg:p-10"><Outlet /></main>
    </div>
  );
}
