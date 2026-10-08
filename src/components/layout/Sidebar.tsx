import { NavLink } from 'react-router-dom';
import { navigationItems } from './navItems';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <img src="/logo.png" alt="EMCOOP logo" className="w-10 h-10 rounded-lg" />
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg">EMCOOP</h1>
              <p className="text-xs text-slate-400">Ex-Lex to the world</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                    {isOpen && item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        3
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">AA</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
