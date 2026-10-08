import { Menu, Search, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NotificationsPanel } from './NotificationsPanel';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const Header = ({ sidebarOpen, toggleSidebar }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header
      className={`bg-white/95 backdrop-blur border-b border-gray-200 h-16 fixed top-0 right-0 left-0 z-30 transition-all duration-300 ${
        sidebarOpen ? 'lg:left-64' : 'lg:left-20'
      }`}
    >
      <div className="h-full flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-9 h-9 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Financial Control Center</h1>
            <p className="text-xs text-slate-500 truncate">
              Monitor and control all cooperative transactions across Communities, Branches, Zones and Apex
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions, accounts, members..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

        
          {/* Notifications */}
          <NotificationsPanel />

          {/* User Avatar & Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Super Admin'}</p>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
