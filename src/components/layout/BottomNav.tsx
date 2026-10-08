import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { primaryNavItems } from './navItems';

interface BottomNavProps {
  onOpenMore: () => void;
  moreActive: boolean;
}

const navLabelClass = (isActive: boolean) =>
  `relative flex min-w-0 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
    isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
  }`;

export const BottomNav = ({ onOpenMore, moreActive }: BottomNavProps) => {
  const columns = primaryNavItems.length + 1; // +1 for the "More" tab

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => navLabelClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-7 w-12 max-w-full items-center justify-center rounded-full transition-colors ${
                        isActive ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="truncate px-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            aria-label="More menu"
            className={navLabelClass(moreActive)}
          >
            <span
              className={`flex h-7 w-12 max-w-full items-center justify-center rounded-full transition-colors ${
                moreActive ? 'bg-emerald-500/10' : ''
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </span>
            <span className="truncate px-1">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};