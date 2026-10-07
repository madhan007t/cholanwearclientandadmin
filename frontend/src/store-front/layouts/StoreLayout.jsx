import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header, { AnnouncementBar } from '../components/Header';
import Footer from '../components/Footer';
import { PageTransition } from '../../components/motion';
import { useSettings } from '../../store/settingsStore';

export default function StoreLayout() {
  const { pathname } = useLocation();
  const load = useSettings((s) => s.load);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);

  return (
    <div className="store-front flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-gold focus:px-4 focus:py-2 focus:text-brand-black">Skip to content</a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {/* Home has its own hero entrance, so it only cross-fades (no vertical shift). */}
        <PageTransition routeKey={pathname} lift={pathname !== '/'}><Outlet /></PageTransition>
      </main>
      <Footer />
    </div>
  );
}
