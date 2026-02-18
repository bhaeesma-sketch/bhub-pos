import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Plus, Trash2, Package, Truck, CheckCircle2, XCircle,
    Search, ChevronDown, ChevronRight, RefreshCw, ShoppingBag,
    Calendar, DollarSign, AlertCircle, Barcode,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useSupabaseData';

// ─── Types ────────────────────────────────────────────────────────────────────
interface POItem {
    id?: string;
    product_name: string;
    quantity: number;
    unit_cost: number;
    sale_price: number;
    total_cost: number;
    expiry_date: string | null;
    // local only — for linking to existing product
    product_id?: string | null;
}

interface PurchaseOrder {
    id: string;
    order_id: string;
    supplier: string | null;
    amount: number;
    shipment_cost: number;
    total_items: number;
    status: string;
    created_at: string;
    items?: POItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `OMR ${n.toFixed(3)}`;
const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
};
const genOrderId = () => `PO-${Date.now().toString(36).toUpperCase()}`;

const STATUS_STYLES: Record<string, string> = {
    pending: 'border-amber-300 text-amber-700 bg-amber-50',
    received: 'border-green-300 text-green-700 bg-green-50',
    cancelled: 'border-red-300 text-red-600 bg-red-50',
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function usePurchaseOrders() {
    return useQuery({
        queryKey: ['purchase_orders'],
        queryFn: async () => {
            const { data: orders, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;

            // Fetch items for each order
            const { data: items, error: itemsErr } = await supabase
                .from('purchase_order_items')
                .select('*');
            if (itemsErr) throw itemsErr;

            return (orders ?? []).map(o => ({
                ...o,
                items: (items ?? []).filter(i => i.purchase_order_id === o.id),
            })) as PurchaseOrder[];
        },
        staleTime: 15_000,
    });
}

// ─── Empty item row ───────────────────────────────────────────────────────────
const emptyItem = (): POItem => ({
    product_name: '',
    quantity: 1,
    unit_cost: 0,
    sale_price: 0,
    total_cost: 0,
    expiry_date: null,
    product_id: null,
});

// ─── Create PO Modal ──────────────────────────────────────────────────────────
const CreatePOModal = ({
    open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) => {
    const { data: dbProducts = [] } = useProducts();
    const [supplier, setSupplier] = useState('');
    const [shipmentCost, setShipmentCost] = useState('0');
    const [items, setItems] = useState<POItem[]>([emptyItem()]);
    const [saving, setSaving] = useState(false);
    const [productSearch, setProductSearch] = useState<Record<number, string>>({});

    const updateItem = (idx: number, field: keyof POItem, value: any) => {
        setItems(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            // Auto-calc total_cost
            if (field === 'quantity' || field === 'unit_cost') {
                const qty = field === 'quantity' ? Number(value) : next[idx].quantity;
                const uc = field === 'unit_cost' ? Number(value) : next[idx].unit_cost;
                next[idx].total_cost = +(qty * uc).toFixed(3);
            }
            return next;
        });
    };

    const selectProduct = (idx: number, product: { id: string; name: string; price: number }) => {
        setItems(prev => {
            const next = [...prev];
            next[idx] = {
                ...next[idx],
                product_name: product.name,
                sale_price: product.price,
                product_id: product.id,
            };
            return next;
        });
        setProductSearch(prev => ({ ...prev, [idx]: '' }));
    };

    const subtotal = items.reduce((s, i) => s + i.total_cost, 0);
    const grandTotal = subtotal + Number(shipmentCost || 0);

    const handleSave = async () => {
        if (items.some(i => !i.product_name.trim())) {
            toast.error('All items need a product name');
            return;
        }
        setSaving(true);
        try {
            const orderId = genOrderId();
            const { data: po, error: poErr } = await supabase
                .from('purchase_orders')
                .insert({
                    order_id: orderId,
                    supplier: supplier || null,
                    amount: grandTotal,
                    shipment_cost: Number(shipmentCost || 0),
                    total_items: items.reduce((s, i) => s + i.quantity, 0),
                    status: 'pending',
                })
                .select()
                .single();

            if (poErr || !po) throw poErr;

            const { error: itemsErr } = await supabase
                .from('purchase_order_items')
                .insert(items.map(i => ({
                    purchase_order_id: po.id,
                    product_name: i.product_name,
                    quantity: i.quantity,
                    unit_cost: i.unit_cost,
                    sale_price: i.sale_price,
                    total_cost: i.total_cost,
                    expiry_date: i.expiry_date || null,
                })));

            if (itemsErr) throw itemsErr;

            toast.success(`✅ Purchase Order ${orderId} created!`);
            onCreated();
            onClose();
            setSupplier('');
            setShipmentCost('0');
            setItems([emptyItem()]);
        } catch (err: any) {
            toast.error(`Failed: ${err?.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4"
            >
                {/* Header */}
                <div className="bg-slate-900 p-5 text-white">
                    <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        New Purchase Order
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Record stock received from supplier</p>
                </div>

                <div className="p-5 space-y-5">
                    {/* Supplier + Shipment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Supplier Name</label>
                            <input
                                value={supplier}
                                onChange={e => setSupplier(e.target.value)}
                                placeholder="e.g. Al Marai, Oman Foods..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">Shipment Cost (OMR)</label>
                            <input
                                type="number"
                                value={shipmentCost}
                                onChange={e => setShipmentCost(e.target.value)}
                                min="0"
                                step="0.001"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Items Received</label>
                            <button
                                onClick={() => setItems(prev => [...prev, emptyItem()])}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {items.map((item, idx) => {
                                const search = productSearch[idx] || '';
                                const suggestions = search.length >= 2
                                    ? dbProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
                                    : [];

                                return (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Item {idx + 1}</span>
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-destructive/60 hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Product name with autocomplete */}
                                        <div className="relative">
                                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Product Name</label>
                                            <input
                                                value={search || item.product_name}
                                                onChange={e => {
                                                    setProductSearch(prev => ({ ...prev, [idx]: e.target.value }));
                                                    updateItem(idx, 'product_name', e.target.value);
                                                }}
                                                placeholder="Type to search or enter name..."
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                            {suggestions.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                                                    {suggestions.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => selectProduct(idx, p)}
                                                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 text-left text-xs"
                                                        >
                                                            <span className="font-medium text-slate-900">{p.name}</span>
                                                            <span className="text-slate-400 font-bold">{p.price.toFixed(3)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    min="1"
                                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Unit Cost</label>
                                                <input
                                                    type="number"
                                                    value={item.unit_cost}
                                                    onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))}
                                                    min="0"
                                                    step="0.001"
                                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Sale Price</label>
                                                <input
                                                    type="number"
                                                    value={item.sale_price}
                                                    onChange={e => updateItem(idx, 'sale_price', Number(e.target.value))}
                                                    min="0"
                                                    step="0.001"
                                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={item.expiry_date || ''}
                                                    onChange={e => updateItem(idx, 'expiry_date', e.target.value || null)}
                                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-black text-primary">
                                                Line Total: {fmt(item.total_cost)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500 font-bold">
                            <span>Items Subtotal</span>
                            <span>{fmt(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 font-bold">
                            <span>Shipment Cost</span>
                            <span>{fmt(Number(shipmentCost || 0))}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                            <span>Grand Total</span>
                            <span className="text-primary">{fmt(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-black hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || items.length === 0}
                            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── PO Row ───────────────────────────────────────────────────────────────────
const PORow = ({ po, onRefetch }: { po: PurchaseOrder; onRefetch: () => void }) => {
    const [expanded, setExpanded] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const { data: dbProducts = [] } = useProducts();

    const handleReceive = async () => {
        if (!confirm(`Mark PO ${po.order_id} as RECEIVED?\n\nThis will add stock to matching products in your inventory.`)) return;
        setReceiving(true);
        try {
            // Update stock for each item that matches a product
            for (const item of po.items ?? []) {
                // Try to find matching product by name (case-insensitive)
                const match = dbProducts.find(p =>
                    p.name.toLowerCase() === item.product_name.toLowerCase()
                );
                if (match) {
                    await supabase
                        .from('products')
                        .update({ stock: (match.stock ?? 0) + item.quantity })
                        .eq('id', match.id);
                }
            }

            // Mark PO as received
            const { error } = await supabase
                .from('purchase_orders')
                .update({ status: 'received' })
                .eq('id', po.id);

            if (error) throw error;
            toast.success(`✅ PO ${po.order_id} received — stock updated!`);
            onRefetch();
        } catch (err: any) {
            toast.error(`Failed: ${err?.message}`);
        } finally {
            setReceiving(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm(`Cancel PO ${po.order_id}?`)) return;
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'cancelled' })
            .eq('id', po.id);
        if (error) { toast.error('Failed to cancel'); return; }
        toast.success('PO cancelled');
        onRefetch();
    };

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    {expanded
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    }
                    <div className="min-w-0">
                        <p className="text-sm font-black text-foreground">{po.order_id}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {po.supplier || 'No supplier'} · {fmtDate(po.created_at)} · {po.total_items} units
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border capitalize', STATUS_STYLES[po.status] ?? 'border-slate-200 text-slate-500 bg-slate-50')}>
                        {po.status}
                    </span>
                    <span className="text-sm font-black text-foreground">{fmt(po.amount)}</span>
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-border bg-slate-50 p-4 space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <p className="text-[10px] text-muted-foreground">Supplier</p>
                            <p className="text-xs font-black text-foreground">{po.supplier || '—'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <p className="text-[10px] text-muted-foreground">Shipment Cost</p>
                            <p className="text-xs font-black text-foreground">{fmt(po.shipment_cost)}</p>
                        </div>
                        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                            <p className="text-[10px] text-primary">Total Paid</p>
                            <p className="text-xs font-black text-primary">{fmt(po.amount)}</p>
                        </div>
                    </div>

                    {/* Items table */}
                    {po.items && po.items.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[10px]">Product</TableHead>
                                    <TableHead className="text-right text-[10px]">Qty</TableHead>
                                    <TableHead className="text-right text-[10px]">Unit Cost</TableHead>
                                    <TableHead className="text-right text-[10px]">Sale Price</TableHead>
                                    <TableHead className="text-right text-[10px]">Total</TableHead>
                                    <TableHead className="text-right text-[10px]">Expiry</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {po.items.map((item, i) => {
                                    const matched = dbProducts.find(p => p.name.toLowerCase() === item.product_name.toLowerCase());
                                    return (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs font-medium py-2">
                                                <div className="flex items-center gap-1.5">
                                                    {item.product_name}
                                                    {matched
                                                        ? <span className="text-[9px] text-green-600 font-black bg-green-50 px-1.5 py-0.5 rounded-full">✓ In Inventory</span>
                                                        : <span className="text-[9px] text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded-full">Not linked</span>
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-xs py-2 font-bold">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-xs py-2">{item.unit_cost.toFixed(3)}</TableCell>
                                            <TableCell className="text-right text-xs py-2">{item.sale_price.toFixed(3)}</TableCell>
                                            <TableCell className="text-right text-xs font-bold text-primary py-2">{fmt(item.total_cost)}</TableCell>
                                            <TableCell className="text-right text-xs py-2 text-muted-foreground">
                                                {item.expiry_date ? fmtDate(item.expiry_date) : '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-3">No items recorded</p>
                    )}

                    {/* Action buttons */}
                    {po.status === 'pending' && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleReceive}
                                disabled={receiving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-xs font-black hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {receiving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Mark as Received (Updates Stock)
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-black hover:bg-red-100 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Purchases = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const { data: orders = [], isLoading, refetch } = usePurchaseOrders();

    const filtered = useMemo(() => {
        return orders.filter(o => {
            const matchStatus = filterStatus === 'all' || o.status === filterStatus;
            const matchSearch = !search ||
                o.order_id.toLowerCase().includes(search.toLowerCase()) ||
                (o.supplier ?? '').toLowerCase().includes(search.toLowerCase()) ||
                o.items?.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
            return matchStatus && matchSearch;
        });
    }, [orders, search, filterStatus]);

    const totalSpent = orders.filter(o => o.status === 'received').reduce((s, o) => s + o.amount, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const received = orders.filter(o => o.status === 'received').length;

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Purchase Orders</h1>
                    <p className="text-sm text-muted-foreground">Track stock received from suppliers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:brightness-110 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Purchase Order
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                    <p className="text-2xl font-black text-foreground">{orders.length}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-black text-amber-600">{pending}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Received</p>
                    <p className="text-2xl font-black text-green-600">{received}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-xl font-black text-primary">{fmt(totalSpent)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'received', 'cancelled'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                                    filterStatus === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
                                )}
                            >
                                {s === 'all' ? 'All Orders' : s}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search PO, supplier, product..."
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
            </div>

            {/* Orders list */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading orders...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-sm font-bold text-muted-foreground">No purchase orders yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Click "New Purchase Order" to record stock received from a supplier</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:brightness-110 transition-all"
                        >
                            Create First PO
                        </button>
                    </div>
                ) : (
                    filtered.map(po => (
                        <PORow key={po.id} po={po} onRefetch={refetch} />
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <CreatePOModal
                        open={showCreate}
                        onClose={() => setShowCreate(false)}
                        onCreated={() => refetch()}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Purchases;
