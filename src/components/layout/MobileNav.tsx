import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaffSession } from '@/contexts/StaffContext';

const allMenuItems = [
  { icon: ShoppingCart, label: 'POS', path: '/pos', ownerOnly: false },
  { icon: Package, label: 'Inventory', path: '/products', ownerOnly: false },
  { icon: ShoppingBag, label: 'Purchases', path: '/purchases', ownerOnly: true },
  { icon: BarChart3, label: 'Reports', path: '/reports', ownerOnly: true },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', ownerOnly: true },
  { icon: Settings, label: 'Settings', path: '/settings', ownerOnly: true },
];

// Pages that have their own bottom UI — hide the nav bar on these
const HIDE_ON = ['/pos'];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffSession } = useStaffSession();

  // Hide on POS — it has its own SCAN + View Cart FABs
  if (HIDE_ON.includes(location.pathname)) return null;

  const isOwner = staffSession?.role === 'owner';

  const menuItems = isOwner
    ? allMenuItems
    : allMenuItems.filter(item => !item.ownerOnly);

  // Max 5 visible
  const visibleItems = menuItems.slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1',
                isActive
                  ? isOwner
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-primary bg-primary/10'
                  : 'text-slate-400 hover:text-slate-700'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
