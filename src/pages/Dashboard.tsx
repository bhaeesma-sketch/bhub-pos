import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useProducts, useCustomers, useTransactions } from '@/hooks/useSupabaseData';
import { useMemo } from 'react';
import heroBanner from '@/assets/hero-banner.jpg';
import ScrollReveal from '@/components/animations/ScrollReveal';
import StaggerContainer, { StaggerItem } from '@/components/animations/StaggerContainer';
import PageTransition from '@/components/animations/PageTransition';
import ParallaxScroll from '@/components/animations/ParallaxScroll';
import CountUp from '@/components/animations/CountUp';

const COLORS = ['hsl(160, 60%, 45%)', 'hsl(43, 74%, 52%)', 'hsl(200, 70%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(0, 65%, 50%)'];

const Dashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const { data: transactions = [] } = useTransactions();

  const totalSales = useMemo(() => transactions.reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const totalDebt = useMemo(() => customers.reduce((s, c) => s + Number(c.total_debt), 0), [customers]);
  const lowStock = products.filter(p => p.stock <= p.min_stock).length;

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + p.stock));
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
  }, [products]);

  const recentSales = transactions.slice(0, 5);

  const dailySalesData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = days[d.getDay()];
      const dayTxns = transactions.filter(t => {
        const td = new Date(t.created_at);
        return td.toDateString() === d.toDateString();
      });
      return { day: dayStr, sales: dayTxns.reduce((s, t) => s + Number(t.total), 0), orders: dayTxns.length };
    });
  }, [transactions]);

  return (
    <PageTransition>
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Premium Hero Banner */}
        <ScrollReveal type="blur" duration={0.8}>
          <ParallaxScroll speed={0.15}>
            <div className="relative rounded-2xl overflow-hidden glow-cyan" style={{ minHeight: 180 }}>
              <img src={heroBanner} alt="BHAEES POS" className="w-full h-full object-cover absolute inset-0" style={{ minHeight: 180 }} />
              <div className="relative z-10 p-8 flex items-center justify-between" style={{ minHeight: 180 }}>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold font-heading text-foreground">
                    <span className="text-primary text-glow">BHAEES</span>{' '}
                    <span className="text-gold text-glow-gold">POS</span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your store overview.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </ParallaxScroll>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <StaggerItem>
            <StatCard title="Total Sales" value={`OMR ${totalSales.toFixed(2)}`} change={`${transactions.length} transactions`} changeType="positive" icon={DollarSign} iconColor="gradient-cyan" />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Transactions" value={transactions.length.toString()} change="all time" changeType="positive" icon={ShoppingCart} iconColor="gradient-gold" />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Products" value={products.length.toString()} change={`${lowStock} low stock`} changeType="negative" icon={Package} iconColor="bg-warning" />
          </StaggerItem>
          <StaggerItem>
            <StatCard title="Market Debt" value={`OMR ${totalDebt.toFixed(2)}`} change="outstanding khat" changeType="negative" icon={Users} iconColor="bg-destructive" />
          </StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <ScrollReveal type="fade-left" delay={0.1} className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 glow-cyan h-full">
              <h3 className="text-base font-semibold font-heading text-foreground mb-4">Weekly Sales</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 15%, 20%, 0.3)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(220, 10%, 50%)' }} stroke="hsla(220, 15%, 20%, 0.3)" />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(220, 10%, 50%)' }} stroke="hsla(220, 15%, 20%, 0.3)" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsla(220, 15%, 20%, 0.3)', background: 'hsl(220, 18%, 7%)', color: 'hsl(45, 20%, 95%)', fontSize: '12px' }} />
                  <Bar dataKey="sales" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 60%, 45%)" />
                      <stop offset="100%" stopColor="hsl(160, 60%, 30%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>

          <ScrollReveal type="fade-right" delay={0.2}>
            <div className="glass-card rounded-2xl p-6 h-full">
              <h3 className="text-base font-semibold font-heading text-foreground mb-4">Stock by Category</h3>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsla(220, 15%, 20%, 0.3)', borderRadius: '12px', color: 'hsl(45, 20%, 95%)', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {categoryData.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
              )}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal type="slide-up" delay={0.15}>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold font-heading text-foreground mb-4">Recent Sales</h3>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale, i) => (
                  <ScrollReveal key={sale.id} type="fade-left" delay={i * 0.05} once>
                    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{sale.invoice_no}</p>
                        <p className="text-xs text-muted-foreground">{sale.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground"><span className="text-gold">OMR</span> {Number(sale.total).toFixed(2)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          sale.status === 'paid' ? 'bg-success/20 text-success' :
                          sale.status === 'refunded' ? 'bg-destructive/20 text-destructive' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No sales yet — make your first sale from the POS!</div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
