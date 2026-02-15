import { useState } from 'react';
import { Search, Download, Eye, RotateCcw } from 'lucide-react';
import { useTransactions } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageTransition from '@/components/animations/PageTransition';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { motion } from 'framer-motion';

const Sales = () => {
  const { data: salesList = [], isLoading } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = salesList.filter(s => {
    const matchSearch = s.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) || s.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = salesList.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.total), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Loading sales...</p></div>;
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <ScrollReveal type="fade-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">
                <span className="text-primary text-glow">Sales</span> History
              </h1>
              <p className="text-sm text-muted-foreground">{salesList.length} transactions · Revenue: OMR {totalRevenue.toFixed(3)}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal type="fade-up" delay={0.1}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'paid', 'credit', 'refunded'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                    statusFilter === status ? 'gradient-cyan text-primary-foreground glow-cyan' : 'glass text-secondary-foreground hover:text-foreground'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal type="scale" delay={0.15}>
          <div className="glass-card rounded-xl overflow-hidden glow-cyan">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Items</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Payment</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale, idx) => {
                    const items = (sale as any).transaction_items || [];
                    const itemCount = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
                    return (
                      <motion.tr
                        key={sale.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.5), ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4 font-medium text-primary">{sale.invoice_no}</td>
                        <td className="p-4 text-foreground">{sale.customer_name}</td>
                        <td className="p-4 text-muted-foreground">{new Date(sale.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right text-muted-foreground">{itemCount}</td>
                        <td className="p-4 text-right font-semibold text-foreground">OMR {Number(sale.total).toFixed(3)}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 rounded-full glass text-xs capitalize">{sale.payment_type}</span></td>
                        <td className="p-4 text-center">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                            sale.status === 'paid' && 'bg-success/20 text-success',
                            sale.status === 'refunded' && 'bg-destructive/20 text-destructive',
                            sale.status === 'credit' && 'bg-warning/20 text-warning',
                          )}>
                            {sale.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => toast.info('Invoice preview coming soon')} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground">
                              <Eye className="w-4 h-4" />
                            </button>
                            {sale.status === 'paid' && (
                              <button onClick={() => toast.info('Refund flow coming soon')} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No sales found</div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default Sales;
