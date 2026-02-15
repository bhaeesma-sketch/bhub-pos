import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Smartphone,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStaffSession } from '@/contexts/StaffContext';

const allMenuItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/', ownerOnly: true },
  { icon: ShoppingCart, label: 'POS', path: '/pos', ownerOnly: false },
  { icon: Package, label: 'Inventory', path: '/products', ownerOnly: false },
  { icon: Users, label: 'Customers', path: '/customers', ownerOnly: false },
  { icon: Receipt, label: 'Sales', path: '/sales', ownerOnly: false },
  { icon: BarChart3, label: 'Reports', path: '/reports', ownerOnly: true },
  { icon: Smartphone, label: 'Owner', path: '/owner', ownerOnly: true },
  { icon: Settings, label: 'Settings', path: '/settings', ownerOnly: true },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffSession } = useStaffSession();

  const isStaffOnly = staffSession?.role === 'staff';
  const isOwner = staffSession?.role === 'owner';

  const menuItems = isStaffOnly
    ? allMenuItems.filter(item => !item.ownerOnly)
    : allMenuItems;

  // Show max 5 items on mobile bottom nav
  const visibleItems = menuItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0 flex-1',
                isActive
                  ? isOwner
                    ? 'text-gold bg-gold/10'
                    : 'text-primary bg-primary/10'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
