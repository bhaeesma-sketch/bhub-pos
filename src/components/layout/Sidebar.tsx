import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '@/assets/logo-icon.png';
import { useStaffSession } from '@/contexts/StaffContext';
import { isJabalShamsMaster } from '@/lib/subscription';
import { useStoreConfig } from '@/hooks/useSupabaseData';

const allMenuItems = [
  { icon: ShoppingCart, label: 'Register', path: '/pos', ownerOnly: false },
  { icon: Receipt, label: 'Khat', path: '/bhub/khat', ownerOnly: false },
  { icon: Package, label: 'Inventory', path: '/products', ownerOnly: true },
  { icon: ShieldCheck, label: 'Audit', path: '/audit', ownerOnly: true },
  { icon: BarChart3, label: 'Reports', path: '/reports', ownerOnly: true },
  { icon: Users, label: 'Clients', path: '/customers', ownerOnly: true },
  { icon: Settings, label: 'Settings', path: '/settings', ownerOnly: true },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { staffSession } = useStaffSession();
  const { data: storeConfig } = useStoreConfig();
  const isMasterStore = isJabalShamsMaster(storeConfig?.store_name);

  const isOwner = staffSession?.role === 'owner';

  // Add Master Control item if this is the master store
  const menuItemsWithMaster = isMasterStore
    ? [...allMenuItems, { icon: Crown, label: 'Master Control', path: '/master-control', ownerOnly: true, masterOnly: true }]
    : allMenuItems;

  const menuItems = isOwner
    ? menuItemsWithMaster
    : menuItemsWithMaster.filter(item => !item.ownerOnly);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        "h-screen flex flex-col sticky top-0 z-40 bg-sidebar border-r border-sidebar-border",
      )}
    >
      {/* Logo Section */}
      <div className="flex flex-col items-center justify-center pt-8 pb-8 border-b border-sidebar-border/50">
        <div className="w-14 h-14 rounded-full border-2 border-gold p-1 shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-background/50 overflow-hidden relative group cursor-pointer transition-transform active:scale-95">
          <img src={logoIcon} alt="BHAEES" className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center px-4"
          >
            <h1 className="text-[10px] font-black text-gold tracking-[0.3em] uppercase leading-none mb-1">B-HUB RETAIL</h1>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Enterprise Edition</p>
          </motion.div>
        )}
      </div>

      {/* Menu Section */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto pos-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isMasterItem = (item as any).masterOnly;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group',
                isMasterItem && 'border border-gold/30 shadow-[0_0_20px_-5px_hsl(var(--gold)/0.2)]',
                isActive
                  ? isMasterItem
                    ? 'bg-gold/20 text-gold shadow-[0_8px_16px_-4px_hsl(var(--gold)/0.4)]'
                    : 'bg-primary text-primary-foreground shadow-[0_8px_16px_-4px_rgba(34,197,94,0.3)]'
                  : isMasterItem
                    ? 'text-gold hover:bg-gold/10'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform group-active:scale-90",
                isMasterItem
                  ? "text-gold"
                  : isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-primary"
              )} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden whitespace-nowrap tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className={cn(
                    "absolute left-[-12px] w-1 h-6 rounded-r-full",
                    isMasterItem ? "bg-gold" : "bg-primary"
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User / Settings Footer */}
      <div className="p-3 border-t border-sidebar-border/50">
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-xl transition-all",
          collapsed ? "justify-center" : "bg-muted/30"
        )}>
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
            <Users className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] font-black text-foreground truncate uppercase">{staffSession?.name}</p>
              <p className="text-[8px] font-bold text-gold uppercase tracking-tighter">{staffSession?.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 w-full flex items-center justify-center h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-sidebar-border/30"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
