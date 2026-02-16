import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, Package, CreditCard, FileText, RotateCcw, ClipboardList, Warehouse, Users, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { monthlySalesData, dailySalesData, topSellingProducts } from '@/data/mockData';
import {
  digitalSummary,
  creditCustomersPeriod,
  creditCustomersAllTime,
  inventoryReport,
  purchaseOrders,
  transactionsReport,
  refundsReport,
} from '@/data/reportData';
import StatCard from '@/components/dashboard/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const tabs = [
  { id: 'summary', label: 'Digital Summary', icon: FileText },
  { id: 'inventory', label: 'Stock / Inventory', icon: Warehouse },
  { id: 'credit', label: 'Customer Credit', icon: CreditCard },
  { id: 'purchase', label: 'Purchase Orders', icon: ClipboardList },
  { id: 'transactions', label: 'Transactions', icon: ShoppingCart },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

const profitData = [
  { month: 'Jan', revenue: 32500, cost: 22750, profit: 9750 },
  { month: 'Feb', revenue: 28900, cost: 20230, profit: 8670 },
  { month: 'Mar', revenue: 35200, cost: 24640, profit: 10560 },
  { month: 'Apr', revenue: 31800, cost: 22260, profit: 9540 },
  { month: 'May', revenue: 38500, cost: 26950, profit: 11550 },
  { month: 'Jun', revenue: 42100, cost: 29470, profit: 12630 },
];

const PIE_COLORS = ['hsl(217, 91%, 50%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

// ============ SUB COMPONENTS ============

const DigitalSummaryTab = () => {
  const s = digitalSummary;
  const totalSalesAmount = s.salesDetails.reduce((a, b) => a + b.amount, 0);
  const pieData = s.salesDetails.filter(d => d.amount > 0).map(d => ({ name: d.label, value: d.amount }));

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-card-foreground">{s.storeName}</h3>
            <p className="text-sm text-muted-foreground">Period: {s.period} &bull; Currency: {s.currency}</p>
          </div>
          <Badge variant="outline" className="text-xs">{s.currency}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.totalTransactions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Transactions</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.nonWeightedQty.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Non-Weighted Items Sold</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.weightedQty} {s.weightedUnit}</p>
            <p className="text-xs text-muted-foreground mt-1">Weighted Items Sold</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Details */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-semibold text-card-foreground mb-4">Sales Details</h4>
          <div className="space-y-3">
            {s.salesDetails.map(d => (
              <div key={d.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{d.label}</span>
                <span className="text-sm font-semibold text-foreground">{s.currency} {d.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-primary/5 rounded-lg px-3 -mx-1">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold text-primary">{s.currency} {totalSalesAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h4 className="text-base font-semibold text-card-foreground mb-4">Sales Breakdown</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${s.currency} ${v.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outstanding + Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {s.outstanding.map(o => (
          <div key={o.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{o.label}</p>
            <p className="text-xl font-bold text-foreground">{s.currency} {o.amount.toFixed(2)}</p>
          </div>
        ))}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Customer Refund</p>
          <p className="text-xl font-bold text-destructive">{s.currency} {s.customerRefund.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Net Cash</p>
          <p className="text-3xl font-bold text-foreground">{s.currency} {s.netCash.toFixed(2)}</p>
        </div>
        <div className="bg-primary/10 rounded-xl border border-primary/20 p-5 shadow-sm text-center">
          <p className="text-xs text-primary mb-1">Grand Total Sales</p>
          <p className="text-3xl font-bold text-primary">{s.currency} {s.grandTotalSales.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const InventoryTab = () => {
  const [search, setSearch] = useState('');
  const filtered = inventoryReport.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = inventoryReport.reduce((a, b) => a + b.totalStockValue, 0);
  const totalInStock = inventoryReport.reduce((a, b) => a + b.inStock, 0);
  const totalSold = inventoryReport.reduce((a, b) => a + b.sold, 0);
  const outOfStock = inventoryReport.filter(i => i.inStock === 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Stock Value" value={`OMR ${totalValue.toFixed(2)}`} change={`${inventoryReport.length} products`} changeType="positive" icon={DollarSign} iconColor="bg-primary" />
        <StatCard title="Total In Stock" value={totalInStock.toLocaleString()} change="units available" changeType="positive" icon={Package} iconColor="bg-success" />
        <StatCard title="Total Sold" value={totalSold.toLocaleString()} change="units sold" changeType="positive" icon={ShoppingCart} iconColor="bg-info" />
        <StatCard title="Out of Stock" value={outOfStock.toString()} change="items need restock" changeType="negative" icon={Warehouse} iconColor="bg-destructive" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-card-foreground">Inventory Report</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground w-64 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="overflow-auto max-h-[500px] pos-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Stock Value</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Missing</TableHead>
                <TableHead className="text-right">Expired</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-right">OMR {item.totalStockValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.inStock}</TableCell>
                  <TableCell className="text-right">{item.sold}</TableCell>
                  <TableCell className="text-right">{item.missing}</TableCell>
                  <TableCell className="text-right">{item.expired}</TableCell>
                  <TableCell>
                    {item.inStock === 0 ? (
                      <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                    ) : item.inStock <= 3 ? (
                      <Badge variant="outline" className="text-[10px] border-warning text-warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-success text-success">In Stock</Badge>
                    )}
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

const CustomerCreditTab = () => {
  const [view, setView] = useState<'period' | 'alltime'>('period');
  const data = view === 'period' ? creditCustomersPeriod : creditCustomersAllTime;
  const totalDebt = data.reduce((a, b) => a + b.totalDebt, 0);
  const totalSpent = data.reduce((a, b) => a + b.totalSpent, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Debt" value={`OMR ${totalDebt.toFixed(2)}`} change={`${data.length} customers`} changeType="negative" icon={CreditCard} iconColor="bg-destructive" />
        <StatCard title="Total Spent" value={`OMR ${totalSpent.toFixed(2)}`} change="by credit customers" changeType="positive" icon={DollarSign} iconColor="bg-success" />
        <StatCard title="Customers with Debt" value={data.filter(c => c.totalDebt > 0).length.toString()} change="outstanding balances" changeType="negative" icon={Users} iconColor="bg-warning" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-card-foreground">Customer Credit Report</h4>
          <div className="flex gap-2">
            <button onClick={() => setView('period')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'period' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              09 Jul – 09 Aug 2024
            </button>
            <button onClick={() => setView('alltime')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'alltime' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              All Time
            </button>
          </div>
        </div>
        <div className="overflow-auto max-h-[500px] pos-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Total Debt (OMR)</TableHead>
                <TableHead className="text-right">Total Spent (OMR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell className="font-medium text-foreground capitalize">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className={`text-right font-semibold ${c.totalDebt > 0 ? 'text-destructive' : 'text-foreground'}`}>{c.totalDebt.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{c.totalSpent.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3} className="text-right">Total</TableCell>
                <TableCell className="text-right text-destructive">{totalDebt.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totalSpent.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

const PurchaseOrderTab = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalAmount = purchaseOrders.reduce((a, b) => a + b.amount, 0);
  const totalItems = purchaseOrders.reduce((a, b) => a + b.totalItems, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Orders" value={purchaseOrders.length.toString()} change="purchase orders" changeType="positive" icon={ClipboardList} iconColor="bg-primary" />
        <StatCard title="Total Items" value={totalItems.toLocaleString()} change="items ordered" changeType="positive" icon={Package} iconColor="bg-info" />
        <StatCard title="Total Amount" value={`OMR ${totalAmount.toFixed(2)}`} change="spent on purchases" changeType="negative" icon={DollarSign} iconColor="bg-warning" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-2">
        <h4 className="text-base font-semibold text-card-foreground mb-4">Purchase Order Report</h4>
        {purchaseOrders.map(po => (
          <div key={po.id} className="border border-border rounded-lg overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === po.id ? null : po.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4 text-sm">
                {expandedId === po.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <span className="font-mono font-semibold text-primary">{po.id}</span>
                <span className="text-muted-foreground">{po.supplier}</span>
                <Badge variant="outline" className="text-[10px]">{po.status}</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{po.date}</span>
                <span className="font-semibold text-foreground">{po.totalItems} items</span>
                <span className="font-bold text-foreground">OMR {po.amount.toFixed(2)}</span>
              </div>
            </button>
            {expandedId === po.id && (
              <div className="border-t border-border bg-muted/30 px-4 py-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sale Price</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-right">{item.salePrice.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.unitCost.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">{item.totalCost.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TransactionsTab = () => {
  const [search, setSearch] = useState('');
  const filtered = transactionsReport.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = transactionsReport.reduce((a, b) => a + b.revenue, 0);
  const totalProfit = transactionsReport.reduce((a, b) => a + b.profit, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Transactions" value={transactionsReport.length.toString()} change="transactions" changeType="positive" icon={ShoppingCart} iconColor="bg-primary" />
        <StatCard title="Total Revenue" value={`OMR ${totalRevenue.toFixed(2)}`} change="from transactions" changeType="positive" icon={DollarSign} iconColor="bg-success" />
        <StatCard title="Total Profit" value={`OMR ${totalProfit.toFixed(2)}`} change="net profit" changeType="positive" icon={TrendingUp} iconColor="bg-info" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-card-foreground">Transactions Report</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transaction..." className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground w-64 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="overflow-auto max-h-[500px] pos-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={`${t.id}-${t.barcode}`}>
                  <TableCell className="font-mono text-xs text-primary">{t.id}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.customer}</TableCell>
                  <TableCell className="font-medium text-xs">{t.description}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.date}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{t.paymentType}</Badge></TableCell>
                  <TableCell className="text-right text-xs">{t.salePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">{t.quantity}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{t.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">{t.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-semibold text-success">{t.profit.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] border-success text-success">{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

const RefundsTab = () => {
  const totalRefundRevenue = refundsReport.reduce((a, b) => a + b.revenue, 0);
  const totalRefundLoss = refundsReport.reduce((a, b) => a + b.profit, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Refunds" value={refundsReport.length.toString()} change="refund transactions" changeType="negative" icon={RotateCcw} iconColor="bg-destructive" />
        <StatCard title="Refund Amount" value={`OMR ${totalRefundRevenue.toFixed(2)}`} change="total refunded" changeType="negative" icon={DollarSign} iconColor="bg-warning" />
        <StatCard title="Profit Lost" value={`OMR ${totalRefundLoss.toFixed(2)}`} change="from refunds" changeType="negative" icon={TrendingUp} iconColor="bg-destructive" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h4 className="text-base font-semibold text-card-foreground mb-4">Refund Report</h4>
        <div className="overflow-auto max-h-[500px] pos-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundsReport.map(r => (
                <TableRow key={`${r.id}-${r.description}`}>
                  <TableCell className="font-mono text-xs text-primary">{r.id}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.customer}</TableCell>
                  <TableCell className="font-medium text-xs">{r.description}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.date}</TableCell>
                  <TableCell className="text-right text-xs">{r.salePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">{r.quantity}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">{r.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">{r.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-semibold text-destructive">{r.profit.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'Refunded' ? 'destructive' : 'outline'} className="text-[10px]">
                      {r.status}
                    </Badge>
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

const AnalyticsTab = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Monthly Revenue" value="OMR 4,698.07" change="+8.1% vs last month" changeType="positive" icon={DollarSign} iconColor="bg-primary" />
      <StatCard title="Monthly Profit" value="OMR 1,563.00" change="+5.2% vs last month" changeType="positive" icon={TrendingUp} iconColor="bg-success" />
      <StatCard title="Avg. Order Value" value="OMR 0.72" change="per transaction" changeType="positive" icon={ShoppingCart} iconColor="bg-warning" />
      <StatCard title="Items Sold" value="20,147" change="+12.3% vs last month" changeType="positive" icon={Package} iconColor="bg-info" />
    </div>
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <h3 className="text-base font-semibold text-card-foreground mb-4">Revenue vs Profit</h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={profitData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} />
          <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(217, 91%, 50%)" fill="hsl(217, 91%, 50%)" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="profit" stackId="2" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Monthly Sales Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} />
            <Line type="monotone" dataKey="sales" stroke="hsl(217, 91%, 50%)" strokeWidth={2.5} dot={{ fill: 'hsl(217, 91%, 50%)', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Daily Orders This Week</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} />
            <Bar dataKey="orders" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <h3 className="text-base font-semibold text-card-foreground mb-4">Top Selling Products</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 font-medium text-muted-foreground">#</th>
            <th className="text-left py-3 font-medium text-muted-foreground">Product</th>
            <th className="text-right py-3 font-medium text-muted-foreground">Quantity Sold</th>
            <th className="text-right py-3 font-medium text-muted-foreground">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {topSellingProducts.map((p, i) => (
            <tr key={p.name} className="border-b border-border last:border-0">
              <td className="py-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span></td>
              <td className="py-3 font-medium text-foreground">{p.name}</td>
              <td className="py-3 text-right text-muted-foreground">{p.sold}</td>
              <td className="py-3 text-right font-semibold text-foreground">OMR {p.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ============ MAIN COMPONENT ============

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const renderTab = () => {
    switch (activeTab) {
      case 'summary': return <DigitalSummaryTab />;
      case 'inventory': return <InventoryTab />;
      case 'credit': return <CustomerCreditTab />;
      case 'purchase': return <PurchaseOrderTab />;
      case 'transactions': return <TransactionsTab />;
      case 'refunds': return <RefundsTab />;
      case 'analytics': return <AnalyticsTab />;
      default: return <DigitalSummaryTab />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive business reports – B-HUB POS</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl border border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
};

export default Reports;
