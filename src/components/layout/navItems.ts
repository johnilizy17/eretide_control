import {
  LayoutDashboard,
  ArrowLeftRight,
  CheckSquare,
  Wallet,
  Send,
  Activity,
  Building2,
  MapPin,
  Users,
  FileText,
  Lock,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Show a pending-count badge (Approvals). */
  badge?: boolean;
}

export const navigationItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/approvals', label: 'Approvals', icon: CheckSquare, badge: true },
  { path: '/accounts', label: 'Accounts', icon: Wallet },
  { path: '/transfers', label: 'Transfers', icon: Send },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/branches', label: 'Branches', icon: Building2 },
  { path: '/zones', label: 'Zones', icon: MapPin },
  { path: '/communities', label: 'Communities', icon: Users },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/freeze-restrict', label: 'Freeze / Restrict', icon: Lock },
  { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

// The four primary destinations shown directly in the mobile bottom bar.
export const primaryNavPaths = ['/dashboard', '/transactions', '/approvals', '/accounts'];

export const primaryNavItems = navigationItems.filter((item) =>
  primaryNavPaths.includes(item.path)
);

// Everything else lives behind the "More" tab in the drawer.
export const secondaryNavItems = navigationItems.filter(
  (item) => !primaryNavPaths.includes(item.path)
);
