import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, CreditCard,
  FileText, Users, Search, ChevronDown, ChevronRight,
  RefreshCw, Calendar, Banknote, BookOpen, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TxItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  barcode?: string | null;
}
interface PaymentMethod { method: string; amount: number; }
interface Transaction {
  id: string;
  date: string;
  total: number;
  tax: number;
  status: string;
  customer_id: string | null;
  items: TxItem[] | null;
  payment_methods: PaymentMethod[] | null;
}
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  credit_balance: number;
  total_spent: number;
}
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useReportData() {
  const txQuery = useQuery({
    queryKey: ['report_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
    staleTime: 30_000,
  });

  const custQuery = useQuery({
    queryKey: ['report_customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
    staleTime: 30_000,
  });

  const prodQuery = useQuery({
    queryKey: ['report_products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 30_000,
  });

  return {
    transactions: txQuery.data ?? [],
    customers: custQuery.data ?? [],
    products: prodQuery.data ?? [],
    loading: txQuery.isLoading || custQuery.isLoading || prodQuery.isLoading,
    refetch: () => { txQuery.refetch(); custQuery.refetch(); prodQuery.refetch(); },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `OMR ${n.toFixed(3)}`;
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};
const fmtShortDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); }
  catch { return iso; }
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, color = 'bg-primary' }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={cn('text-2xl font-black text-foreground')}>{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
  </div>
);

// ─── SUMMARY TAB ──────────────────────────────────────────────────────────────
const SummaryTab = ({ transactions, customers }: { transactions: Transaction[]; customers: Customer[] }) => {
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalTax = transactions.reduce((s, t) => s + t.tax, 0);
  const cashTx = transactions.filter(t => t.payment_methods?.some(p => p.method === 'Cash'));
  const cardTx = transactions.filter(t => t.payment_methods?.some(p => p.method === 'Card'));
  const khatTx = transactions.filter(t => t.payment_methods?.some(p => p.method?.includes('Khat') || p.method === 'Credit'));
  const cashTotal = cashTx.reduce((s, t) => s + t.total, 0);
  const cardTotal = cardTx.reduce((s, t) => s + t.total, 0);
  const khatTotal = khatTx.reduce((s, t) => s + t.total, 0);
  const totalDebt = customers.reduce((s, c) => s + (c.credit_balance ?? 0), 0);

  const pieData = [
    { name: 'Cash', value: cashTotal },
    { name: 'Card', value: cardTotal },
    { name: 'Khat/Credit', value: khatTotal },
  ].filter(d => d.value > 0);

  // Daily revenue for last 14 days
  const last14: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last14[d.toISOString().slice(0, 10)] = 0;
  }
  transactions.forEach(t => {
    const day = t.date?.slice(0, 10);
    if (day && last14[day] !== undefined) last14[day] += t.total;
  });
  const chartData = Object.entries(last14).map(([date, revenue]) => ({
    date: fmtShortDate(date + 'T00:00:00'),
    revenue: +revenue.toFixed(3),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Revenue" value={fmt(totalRevenue)} sub={`${transactions.length} transactions`} />
        <Stat label="Cash Sales" value={fmt(cashTotal)} sub={`${cashTx.length} transactions`} />
        <Stat label="Card Sales" value={fmt(cardTotal)} sub={`${cardTx.length} transactions`} />
        <Stat label="Khat / Credit" value={fmt(khatTotal)} sub={`${khatTx.length} transactions`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Stat label="VAT Collected (5%)" value={fmt(totalTax)} sub="Included in prices" />
        <Stat label="Outstanding Debt" value={fmt(totalDebt)} sub={`${customers.filter(c => (c.credit_balance ?? 0) > 0).length} customers`} />
        <Stat label="Total Customers" value={customers.length.toString()} sub="Registered accounts" />
      </div>

      {/* Revenue Trend */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h4 className="text-base font-bold text-card-foreground mb-4">Revenue – Last 14 Days</h4>
        {transactions.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`OMR ${v.toFixed(3)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment breakdown pie */}
      {pieData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-bold text-card-foreground mb-4">Payment Method Breakdown</h4>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `OMR ${v.toFixed(3)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-sm text-foreground font-medium">{d.name}</span>
                  <span className="text-sm font-bold text-foreground ml-auto">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TRANSACTIONS TAB ─────────────────────────────────────────────────────────
const TransactionsTab = ({ transactions, customers }: { transactions: Transaction[]; customers: Customer[] }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('All');

  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [customers]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const method = t.payment_methods?.[0]?.method ?? '';
      const matchMethod = filterMethod === 'All' || method.includes(filterMethod);
      const matchSearch = search === '' ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.customer_id && custMap[t.customer_id]?.toLowerCase().includes(search.toLowerCase())) ||
        t.items?.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));
      return matchMethod && matchSearch;
    });
  }, [transactions, search, filterMethod, custMap]);

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
  const totalTax = filtered.reduce((s, t) => s + t.tax, 0);
  const totalItems = filtered.reduce((s, t) => s + (t.items?.reduce((a, i) => a + i.quantity, 0) ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Transactions Shown" value={filtered.length.toString()} />
        <Stat label="Total Revenue" value={fmt(totalRevenue)} />
        <Stat label="VAT (5%)" value={fmt(totalTax)} />
        <Stat label="Items Sold" value={totalItems.toString()} />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="text-base font-bold text-card-foreground">All Transactions</h4>
          <div className="flex flex-wrap items-center gap-2">
            {/* Method filter */}
            {['All', 'Cash', 'Card', 'Khat'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMethod(m)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  filterMethod === m ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {m}
              </button>
            ))}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground w-44 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground font-medium">No transactions found</p>
            <p className="text-xs text-muted-foreground mt-1">Make a sale in the POS to see it here</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] pos-scrollbar space-y-2">
            {filtered.map(t => {
              const method = t.payment_methods?.[0]?.method ?? 'Cash';
              const customerName = t.customer_id ? (custMap[t.customer_id] ?? 'Unknown') : 'Walk-in';
              const isOpen = expanded === t.id;
              const methodColor = method.includes('Khat') || method === 'Credit'
                ? 'border-amber-300 text-amber-700 bg-amber-50'
                : method === 'Card'
                  ? 'border-blue-300 text-blue-700 bg-blue-50'
                  : 'border-green-300 text-green-700 bg-green-50';

              return (
                <div key={t.id} className="border border-border rounded-xl overflow-hidden">
                  {/* Row header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{customerName}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', methodColor)}>
                        {method}
                      </span>
                      <span className="text-sm font-black text-foreground">{fmt(t.total)}</span>
                    </div>
                  </button>

                  {/* Expanded items */}
                  {isOpen && (
                    <div className="border-t border-border bg-slate-50 px-4 py-3">
                      {/* Summary row */}
                      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                        <div className="bg-white rounded-lg p-2 border border-slate-200">
                          <p className="text-[10px] text-muted-foreground">Subtotal</p>
                          <p className="text-xs font-black text-foreground">{fmt(t.total - t.tax)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-slate-200">
                          <p className="text-[10px] text-muted-foreground">VAT (5%)</p>
                          <p className="text-xs font-black text-foreground">{fmt(t.tax)}</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                          <p className="text-[10px] text-primary">Total Paid</p>
                          <p className="text-xs font-black text-primary">{fmt(t.total)}</p>
                        </div>
                      </div>

                      {/* Items table */}
                      {t.items && t.items.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px]">Product</TableHead>
                              <TableHead className="text-right text-[10px]">Price</TableHead>
                              <TableHead className="text-right text-[10px]">Qty</TableHead>
                              <TableHead className="text-right text-[10px]">Disc%</TableHead>
                              <TableHead className="text-right text-[10px]">Line Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {t.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs font-medium text-foreground py-2">{item.productName}</TableCell>
                                <TableCell className="text-right text-xs py-2">{item.unitPrice?.toFixed(3)}</TableCell>
                                <TableCell className="text-right text-xs py-2">{item.quantity}</TableCell>
                                <TableCell className="text-right text-xs py-2">
                                  {item.discount ? (
                                    <span className="text-amber-600 font-bold">{item.discount}%</span>
                                  ) : '—'}
                                </TableCell>
                                <TableCell className="text-right text-xs font-bold text-foreground py-2">
                                  {fmt(item.total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">No item details stored</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── CUSTOMER CREDIT TAB ──────────────────────────────────────────────────────
const CustomerCreditTab = ({ customers, transactions }: { customers: Customer[]; transactions: Transaction[] }) => {
  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [customers]);

  const totalDebt = customers.reduce((s, c) => s + (c.credit_balance ?? 0), 0);
  const totalSpent = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const debtors = customers.filter(c => (c.credit_balance ?? 0) > 0);

  // Per-customer transaction history
  const [selectedCust, setSelectedCust] = useState<string | null>(null);
  const custTx = useMemo(() =>
    selectedCust ? transactions.filter(t => t.customer_id === selectedCust) : [],
    [selectedCust, transactions]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Outstanding Debt" value={fmt(totalDebt)} sub={`${debtors.length} customers owe money`} />
        <Stat label="Total Spent (All Customers)" value={fmt(totalSpent)} />
        <Stat label="Registered Customers" value={customers.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer list */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-bold text-card-foreground mb-4">Customer Credit Balances</h4>
          {customers.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No customers yet</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pos-scrollbar">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCust(selectedCust === c.id ? null : c.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                    selectedCust === c.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-primary">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {(c.credit_balance ?? 0) > 0 ? (
                      <>
                        <p className="text-[10px] text-destructive font-black">OWES</p>
                        <p className="text-sm font-black text-destructive">{fmt(c.credit_balance ?? 0)}</p>
                      </>
                    ) : (
                      <span className="text-[10px] text-success font-black px-2 py-0.5 bg-success/10 rounded-full">Clear</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected customer transactions */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-bold text-card-foreground mb-4">
            {selectedCust
              ? `Transactions — ${custMap[selectedCust] ?? 'Customer'}`
              : 'Select a customer to view history'
            }
          </h4>
          {!selectedCust ? (
            <div className="py-10 text-center text-sm text-muted-foreground opacity-50">
              <Users className="w-8 h-8 mx-auto mb-2" />
              Click a customer on the left
            </div>
          ) : custTx.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No transactions for this customer</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pos-scrollbar">
              {custTx.map(t => {
                const method = t.payment_methods?.[0]?.method ?? 'Cash';
                return (
                  <div key={t.id} className="p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-muted-foreground">{fmtDate(t.date)}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{method}</Badge>
                        <span className="text-sm font-black text-foreground">{fmt(t.total)}</span>
                      </div>
                    </div>
                    {t.items && t.items.length > 0 && (
                      <div className="space-y-1">
                        {t.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{item.productName} × {item.quantity}</span>
                            <span className="font-bold">{fmt(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────
const InventoryTab = ({ products, transactions }: { products: Product[]; transactions: Transaction[] }) => {
  const [search, setSearch] = useState('');

  // Calculate units sold per product from transaction items
  const soldMap = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach(t => {
      t.items?.forEach(item => {
        m[item.productId] = (m[item.productId] ?? 0) + item.quantity;
      });
    });
    return m;
  }, [transactions]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const totalSold = Object.values(soldMap).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Stock Value" value={fmt(totalValue)} sub={`${products.length} products`} />
        <Stat label="Total Sold (All Time)" value={totalSold.toString()} sub="units from transactions" />
        <Stat label="Out of Stock" value={outOfStock.toString()} sub="need restocking" />
        <Stat label="Low Stock (≤5)" value={lowStock.toString()} sub="running low" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-card-foreground">Product Inventory</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[500px] pos-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground text-xs">{p.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-right text-xs">{p.price.toFixed(3)}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{p.stock}</TableCell>
                  <TableCell className="text-right text-xs text-primary font-bold">{soldMap[p.id] ?? 0}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{fmt(p.price * p.stock)}</TableCell>
                  <TableCell>
                    {p.stock === 0
                      ? <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                      : p.stock <= 5
                        ? <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Low Stock</Badge>
                        : <Badge variant="outline" className="text-[10px] border-green-400 text-green-600">In Stock</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
const AnalyticsTab = ({ transactions }: { transactions: Transaction[] }) => {
  // Top products by revenue
  const productRevenue: Record<string, { name: string; qty: number; revenue: number }> = {};
  transactions.forEach(t => {
    t.items?.forEach(item => {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productRevenue[item.productId].qty += item.quantity;
      productRevenue[item.productId].revenue += item.total;
    });
  });
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Hourly distribution
  const hourly: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourly[h] = 0;
  transactions.forEach(t => {
    const h = new Date(t.date).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  });
  const hourlyData = Object.entries(hourly)
    .filter(([h]) => Number(h) >= 6 && Number(h) <= 22)
    .map(([h, count]) => ({ hour: `${h}:00`, count }));

  return (
    <div className="space-y-6">
      {/* Top products bar chart */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h4 className="text-base font-bold text-card-foreground mb-4">Top Products by Revenue</h4>
        {topProducts.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => [`OMR ${v.toFixed(3)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Busiest hours */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h4 className="text-base font-bold text-card-foreground mb-4">Busiest Hours (Transactions)</h4>
        {transactions.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products table */}
      {topProducts.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-bold text-card-foreground mb-4">Top 10 Products Detail</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.name}>
                  <TableCell>
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{i + 1}</span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-sm">{p.name}</TableCell>
                  <TableCell className="text-right text-sm font-bold">{p.qty}</TableCell>
                  <TableCell className="text-right text-sm font-black text-primary">{fmt(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'transactions', label: 'Transactions', icon: ShoppingCart },
  { id: 'credit', label: 'Customer Credit', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const { transactions, customers, products, loading, refetch } = useReportData();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Live data from your JABALSHAMS POS</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 transition-all shadow-sm"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading live data...</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl border border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!loading && (
        <>
          {activeTab === 'summary' && <SummaryTab transactions={transactions} customers={customers} />}
          {activeTab === 'transactions' && <TransactionsTab transactions={transactions} customers={customers} />}
          {activeTab === 'credit' && <CustomerCreditTab customers={customers} transactions={transactions} />}
          {activeTab === 'inventory' && <InventoryTab products={products} transactions={transactions} />}
          {activeTab === 'analytics' && <AnalyticsTab transactions={transactions} />}
        </>
      )}
    </div>
  );
};

export default Reports;
