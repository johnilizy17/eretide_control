import { Bell, Menu, Search, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

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
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-slate-900">Financial Control Center</h1>
            <p className="text-xs text-slate-500">
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

          {/* Location Filter */}
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500">
            <option>All Locations</option>
            <option>Apex</option>
            <option>Lagos Zone</option>
            <option>Ikeja Branch</option>
          </select>

          {/* Date Range */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <span>29 Sep 2026 - 29 Sep 2026</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

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
