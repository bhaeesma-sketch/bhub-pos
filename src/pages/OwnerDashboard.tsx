import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Users, TrendingUp, Lock, Unlock, 
  Activity, Eye, EyeOff, LogOut, Wifi, WifiOff, 
  AlertTriangle, Smartphone, BarChart3, Bell, ShieldAlert,
  Percent, Banknote, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { useTransactions, useCustomers, useStaffAlerts, useProducts } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const CASH_THRESHOLD_DEFAULT = 200; // OMR

const OwnerDashboard = () => {
  const { data: transactions = [] } = useTransactions();
  const { data: customers = [] } = useCustomers();
  const { data: staffAlerts = [] } = useStaffAlerts();
  const { data: products = [] } = useProducts();
  const queryClient = useQueryClient();
  const unreadAlerts = staffAlerts.filter(a => !a.is_read);

  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showVaultData, setShowVaultData] = useState(false);
  const [cashThreshold, setCashThreshold] = useState(CASH_THRESHOLD_DEFAULT);
  const [cashAlertSent, setCashAlertSent] = useState(false);
  const [quickDiscountPercent, setQuickDiscountPercent] = useState(0);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Derived stats from live DB
  const totalSales = useMemo(() => transactions.reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const totalDebt = useMemo(() => customers.reduce((s, c) => s + Number(c.total_debt), 0), [customers]);
  const cashSales = useMemo(() => transactions.filter(t => t.payment_type === 'cash').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const cardSales = useMemo(() => transactions.filter(t => t.payment_type === 'card').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const creditSales = useMemo(() => transactions.filter(t => t.payment_type === 'credit').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const digitalSales = useMemo(() => transactions.filter(t => t.payment_type === 'digital').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const refundTotal = useMemo(() => transactions.filter(t => t.status === 'refunded').reduce((s, t) => s + Number(t.total), 0), [transactions]);

  // Today's cash sales for drawer tracker
  const todayCashSales = useMemo(() => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => t.payment_type === 'cash' && new Date(t.created_at).toDateString() === today)
      .reduce((s, t) => s + Number(t.total), 0);
  }, [transactions]);

  const OWNER_WHATSAPP_NUMBERS = ['96898675132', '96876324797'];

  // Cash threshold alert with WhatsApp notification
  const sendWhatsAppAlert = () => {
    const msg = encodeURIComponent(
      `⚠️ BHAEES POS Alert\n\nCash in drawer has reached OMR ${todayCashSales.toFixed(2)}.\nThreshold: OMR ${cashThreshold}\nTime: ${new Date().toLocaleString()}\n\nPlease clear the register.`
    );
    // Open first number directly (won't be blocked since it's a user gesture)
    window.location.href = `https://wa.me/${OWNER_WHATSAPP_NUMBERS[0]}?text=${msg}`;
    // Open second number after a short delay
    if (OWNER_WHATSAPP_NUMBERS.length > 1) {
      setTimeout(() => {
        window.open(`https://wa.me/${OWNER_WHATSAPP_NUMBERS[1]}?text=${msg}`, '_blank');
      }, 1000);
    }
  };

  useEffect(() => {
    if (todayCashSales >= cashThreshold && !cashAlertSent) {
      setCashAlertSent(true);
      toast.warning(`⚠️ Cash in drawer has reached OMR ${todayCashSales.toFixed(2)} — exceeds threshold of OMR ${cashThreshold}`, {
        duration: 15000,
        description: 'Consider clearing the register. Tap the button to notify via WhatsApp.',
        action: {
          label: 'Notify via WhatsApp',
          onClick: sendWhatsAppAlert,
        },
      });
      // Log alert
      supabase.from('staff_alerts').insert({
        staff_name: 'System',
        action: 'cash_threshold_reached',
        details: `Cash in drawer reached OMR ${todayCashSales.toFixed(2)} (threshold: OMR ${cashThreshold}). WhatsApp notification sent to owner.`,
      }).then(() => {});
    }
  }, [todayCashSales, cashThreshold, cashAlertSent]);

  // Near-expiry products
  const nearExpiryProducts = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return products.filter(p => {
      if (!p.expiry_date) return false;
      const exp = new Date(p.expiry_date);
      return exp <= sevenDays && exp >= now;
    });
  }, [products]);

  // Register clearance handler
  const handleRegisterClearance = async () => {
    const amount = todayCashSales;
    await supabase.from('staff_alerts').insert({
      staff_name: 'Owner',
      action: 'register_clearance',
      details: `Cleared OMR ${amount.toFixed(2)} from cash drawer`,
    });
    setCashAlertSent(false);
    toast.success(`✅ Register cleared — OMR ${amount.toFixed(2)} logged`, { duration: 3000 });
    queryClient.invalidateQueries({ queryKey: ['staff_alerts'] });
  };

  // Quick discount for near-expiry items
  const applyQuickDiscount = async () => {
    if (nearExpiryProducts.length === 0) {
      toast.info('No near-expiry products to discount');
      return;
    }
    if (quickDiscountPercent <= 0 || quickDiscountPercent > 90) {
      toast.error('Enter a discount between 1-90%');
      return;
    }
    setApplyingDiscount(true);
    let updated = 0;
    for (const product of nearExpiryProducts) {
      const newPrice = Math.round(product.price * (1 - quickDiscountPercent / 100) * 1000) / 1000;
      const { error } = await supabase.from('products').update({ price: newPrice }).eq('id', product.id);
      if (!error) updated++;
    }
    toast.success(`Applied ${quickDiscountPercent}% discount to ${updated} near-expiry products`);
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setApplyingDiscount(false);
  };

  // Live feed from recent transactions
  const liveFeed = useMemo(() => {
    return transactions.slice(0, 20).map(t => {
      const items = (t as any).transaction_items || [];
      const firstItem = items[0];
      return {
        id: t.invoice_no,
        item: firstItem ? firstItem.product_name : t.customer_name,
        amount: Number(t.total).toFixed(3),
        method: t.payment_type.charAt(0).toUpperCase() + t.payment_type.slice(1),
        time: new Date(t.created_at).toLocaleTimeString(),
        isNew: false,
      };
    });
  }, [transactions]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">
            <span className="text-primary text-glow">Owner</span> Dashboard
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            {isOnline ? <Wifi className="w-3 h-3 text-success" /> : <WifiOff className="w-3 h-3 text-destructive" />}
            {isOnline ? 'Live Connected' : 'Offline Mode'}
            <span className="text-muted-foreground">•</span>
            <Smartphone className="w-3 h-3" /> Mobile View
          </p>
        </div>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className="p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Total Sales" value={`OMR ${totalSales.toFixed(2)}`} change={`${transactions.length} txns`} changeType="positive" icon={DollarSign} iconColor="gradient-cyan" />
        <StatCard title="Net Cash" value={`OMR ${cashSales.toFixed(2)}`} change="cash sales" changeType="positive" icon={ShoppingCart} iconColor="bg-success" />
        <StatCard title="Market Debt" value={`OMR ${totalDebt.toFixed(2)}`} change="total khat" changeType="negative" icon={Users} iconColor="bg-destructive" />
        <StatCard title="Refunds" value={`OMR ${refundTotal.toFixed(2)}`} change="total" changeType="negative" icon={TrendingUp} iconColor="bg-warning" />
      </div>

      {/* Cash-in-Drawer Tracker */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            <Banknote className="w-4 h-4 text-success" />
            Cash-in-Drawer Tracker
          </h3>
          <span className={cn(
            "text-[10px] px-2 py-1 rounded-full font-medium",
            todayCashSales >= cashThreshold ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-success/20 text-success'
          )}>
            {todayCashSales >= cashThreshold ? '⚠ THRESHOLD REACHED' : '● NORMAL'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="glass rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Today's Cash</p>
            <p className={cn("text-lg font-bold font-heading", todayCashSales >= cashThreshold ? 'text-destructive' : 'text-success')}>
              OMR {todayCashSales.toFixed(2)}
            </p>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Threshold</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-muted-foreground">OMR</span>
              <input
                type="number"
                value={cashThreshold}
                onChange={(e) => setCashThreshold(Number(e.target.value))}
                className="w-16 text-center text-lg font-bold font-heading text-warning bg-transparent focus:outline-none"
                min={1}
                max={10000}
              />
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className={cn("h-full rounded-full transition-all", todayCashSales >= cashThreshold ? 'bg-destructive' : 'bg-success')}
            style={{ width: `${Math.min((todayCashSales / cashThreshold) * 100, 100)}%` }}
          />
        </div>
        <button
          onClick={handleRegisterClearance}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-warning/15 text-warning text-xs font-medium hover:bg-warning/25 transition-colors"
        >
          <CheckCircle className="w-4 h-4" /> Register Clearance — Log Cash Removal
        </button>
      </div>

      {/* Expiry Watch + Quick Discount */}
      {nearExpiryProducts.length > 0 && (
        <div className="glass-card rounded-xl p-4 ring-1 ring-warning/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Expiry Watch — {nearExpiryProducts.length} items
            </h3>
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pos-scrollbar mb-3">
            {nearExpiryProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-warning/5 text-xs">
                <span className="text-foreground font-medium truncate flex-1">{p.name}</span>
                <span className="text-warning font-bold ml-2">Exp: {p.expiry_date}</span>
                <span className="text-muted-foreground ml-2">OMR {p.price.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-warning" />
            <input
              type="number"
              placeholder="Discount %"
              value={quickDiscountPercent || ''}
              onChange={(e) => setQuickDiscountPercent(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg glass text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-warning"
              min={1}
              max={90}
            />
            <button
              onClick={applyQuickDiscount}
              disabled={applyingDiscount}
              className="px-4 py-2 rounded-lg bg-warning/20 text-warning text-xs font-medium hover:bg-warning/30 transition-colors disabled:opacity-50"
            >
              {applyingDiscount ? 'Applying...' : 'Apply to All'}
            </button>
          </div>
        </div>
      )}

      {/* Live Transaction Feed */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary pulse-glow rounded-full" />
            Recent Transactions
          </h3>
          <span className="text-[10px] px-2 py-1 rounded-full bg-success/20 text-success font-medium">● LIVE</span>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pos-scrollbar">
          {liveFeed.length > 0 ? liveFeed.map((tx, i) => (
            <motion.div
              key={`${tx.id}-${i}`}
              initial={tx.isNew ? { opacity: 0, x: -20, backgroundColor: 'hsla(187, 100%, 50%, 0.1)' } : {}}
              animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  tx.method === 'Cash' ? 'bg-success' : tx.method === 'Card' ? 'bg-primary' : 'bg-warning'
                )} />
                <div>
                  <p className="text-xs font-medium text-foreground">{tx.item}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.time} • {tx.method}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">OMR {tx.amount}</span>
            </motion.div>
          )) : (
            <div className="text-center py-6 text-xs text-muted-foreground">No transactions yet</div>
          )}
        </div>
      </div>

      {/* The Vault - PIN Protected */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            {isVaultLocked ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-success" />}
            The Vault
          </h3>
          {!isVaultLocked && (
            <div className="flex gap-2">
              <button onClick={() => setShowVaultData(!showVaultData)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                {showVaultData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => { setIsVaultLocked(true); setShowVaultData(false); }} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive">
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isVaultLocked ? (
          <div className="text-center py-6">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-xs text-muted-foreground mb-4">Enter PIN to access financial data</p>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={cn(
                  'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold',
                  pin.length > i ? 'border-primary text-primary' : 'border-border text-transparent'
                )}>
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
                key !== null ? (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === 'del') {
                        setPin(prev => prev.slice(0, -1));
                      } else {
                        const newPin = pin + key;
                        setPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            if (newPin === '1234') {
                              setIsVaultLocked(false);
                              setShowVaultData(true);
                            }
                            setPin('');
                          }, 200);
                        }
                      }
                    }}
                    className="h-10 rounded-lg glass text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {key === 'del' ? '⌫' : key}
                  </button>
                ) : <div key={i} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">Default PIN: 1234</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Net Profit</p>
                <p className="text-lg font-bold font-heading text-success">
                  {showVaultData ? `OMR ${(totalSales - refundTotal).toFixed(2)}` : '•••••'}
                </p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Cash in Drawer</p>
                <p className="text-lg font-bold font-heading text-primary text-glow">
                  {showVaultData ? `OMR ${cashSales.toFixed(2)}` : '•••••'}
                </p>
              </div>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Total Market Debt (Khat)</p>
              <p className="text-lg font-bold font-heading text-destructive">
                {showVaultData ? `OMR ${totalDebt.toFixed(2)}` : '•••••'}
              </p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full debt-gauge-red" style={{ width: `${Math.min((totalDebt / 1000) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Alerts */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            Staff Alerts
            {unreadAlerts.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold animate-pulse">
                {unreadAlerts.length} new
              </span>
            )}
          </h3>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pos-scrollbar">
          {staffAlerts.length > 0 ? staffAlerts.slice(0, 15).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 py-2 px-3 rounded-lg border-b border-border/30 last:border-0 transition-colors',
                !alert.is_read ? 'bg-destructive/5' : 'hover:bg-muted/30'
              )}
            >
              <Bell className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', !alert.is_read ? 'text-destructive' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  <span className="text-warning">{alert.staff_name}</span> — {alert.details}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-xs text-muted-foreground">No alerts — staff is behaving 👍</div>
          )}
        </div>
      </div>

      {/* Remote Controls */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Remote Controls
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="glass rounded-lg p-3 text-center hover:bg-destructive/10 transition-colors group">
            <LogOut className="w-5 h-5 mx-auto mb-1 text-destructive group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-destructive">Kill Sessions</p>
            <p className="text-[10px] text-muted-foreground">Logout all cashiers</p>
          </button>
          <button className="glass rounded-lg p-3 text-center hover:bg-warning/10 transition-colors group">
            <Lock className="w-5 h-5 mx-auto mb-1 text-warning group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-warning">Lock Terminal</p>
            <p className="text-[10px] text-muted-foreground">Freeze POS access</p>
          </button>
        </div>
      </div>

      {/* Sales Breakdown */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Sales Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Cash', amount: cashSales },
            { label: 'Card', amount: cardSales },
            { label: 'Digital', amount: digitalSales },
            { label: 'Customer Credit', amount: creditSales },
          ].map(d => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{d.label}</span>
              <span className="text-xs font-semibold text-foreground">OMR {d.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Grand Total</span>
            <span className="text-sm font-bold text-primary text-glow">OMR {totalSales.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
