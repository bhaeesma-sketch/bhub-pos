import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '@/assets/logo-icon.png';
import { useStaffSession } from '@/contexts/StaffContext';

const allMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', ownerOnly: true },
  { icon: ShoppingCart, label: 'Terminal / POS', path: '/pos', ownerOnly: false },
  { icon: Receipt, label: 'Digital Ledger', path: '/bhub/khat', ownerOnly: false },
  { icon: Package, label: 'Inventory', path: '/products', ownerOnly: false },
  { icon: BarChart3, label: 'Analytics', path: '/reports', ownerOnly: true },
  { icon: Smartphone, label: 'Remote Monitor', path: '/bhub/owner/STORE001', ownerOnly: true },
  { icon: Users, label: 'Customers', path: '/customers', ownerOnly: false },
  { icon: Settings, label: 'Settings', path: '/settings', ownerOnly: true },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { staffSession } = useStaffSession();

  const isStaffOnly = staffSession?.role === 'staff';
  const isOwner = staffSession?.role === 'owner';
  const menuItems = isStaffOnly
    ? allMenuItems.filter(item => !item.ownerOnly)
    : allMenuItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        "h-screen flex flex-col glass-strong sticky top-0 z-40",
        isOwner && "border-r-2 border-gold/30",
        isStaffOnly && "border-r-2 border-info/30"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative">
          <img src={logoIcon} alt="BHAEES POS" className="w-full h-full object-cover" />
          {isOwner && (
            <div className="absolute -top-0.5 -right-0.5">
              <Crown className="w-3 h-3 text-gold" />
            </div>
          )}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-bold font-heading text-foreground tracking-tight">
                <span className="text-primary">B-HUB</span>{' '}
                <span className="text-gold">POS</span>
              </h1>
              <p className={cn(
                "text-[10px] tracking-widest uppercase",
                isOwner ? "text-gold" : isStaffOnly ? "text-info" : "text-muted-foreground"
              )}>
                {isOwner ? '👑 Owner Mode' : isStaffOnly ? '🔵 Staff Mode' : 'Premium Retail'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto pos-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? isOwner
                    ? 'bg-gold/20 text-gold shadow-[0_0_15px_-3px_hsl(var(--gold)/0.3)]'
                    : 'gradient-cyan text-primary-foreground glow-cyan-strong'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Role Badge + Collapse Toggle */}
      <div className="p-2 border-t border-border/50 space-y-1">
        {staffSession && !collapsed && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
            isOwner ? "bg-gold/10 text-gold" : "bg-info/10 text-info"
          )}>
            {isOwner && <Crown className="w-3.5 h-3.5" />}
            <span>{staffSession.name}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
              isOwner ? "bg-gold/20" : "bg-info/20"
            )}>
              {staffSession.role}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
