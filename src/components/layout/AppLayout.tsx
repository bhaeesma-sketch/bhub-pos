import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ScrollToTop from '../animations/ScrollToTop';

const AppLayout = () => {
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);
  const mainRef = useCallback((node: HTMLElement | null) => {
    setMainEl(node);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main ref={mainRef} className="flex-1 overflow-auto scroll-smooth pos-scrollbar pb-16 md:pb-0">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <MobileNav />
      <ScrollToTop scrollContainer={mainEl} />
    </div>
  );
};

export default AppLayout;
