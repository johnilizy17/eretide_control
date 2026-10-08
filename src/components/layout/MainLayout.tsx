import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MoreDrawer } from './MoreDrawer';
import { secondaryNavItems } from './navItems';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const moreActive = secondaryNavItems.some((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main
        className={`pt-16 pb-20 lg:pb-6 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      <BottomNav onOpenMore={() => setMoreOpen(true)} moreActive={moreActive} />
      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
};
