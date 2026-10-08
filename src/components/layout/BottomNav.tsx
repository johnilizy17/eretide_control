import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { primaryNavItems } from './navItems';

interface BottomNavProps {
  onOpenMore: () => void;
  moreActive: boolean;
}

export const BottomNav = ({ onOpenMore, moreActive }: BottomNavProps) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
              moreActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
