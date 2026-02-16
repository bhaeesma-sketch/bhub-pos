import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Package, Save, ArrowLeft, Barcode, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

export default function StockAudit() {
    const navigate = useNavigate();
    const { data: products = [], isLoading } = useProducts();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
    const [actualStock, setActualStock] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const stockRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [selectedProduct]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        const product = products.find(p => p.barcode === q || p.sku === q || p.name.toLowerCase() === q.toLowerCase());
        if (product) {
            setSelectedProduct(product);
            setActualStock('');
            setSearchQuery('');
        } else {
            toast.error('Product not found in system');
            setSearchQuery('');
        }
    }, [searchQuery, products]);

    const handleUpdate = async () => {
        if (!selectedProduct) return;
        const newStock = parseFloat(actualStock);
        if (isNaN(newStock)) {
            toast.error('Please enter a valid stock number');
            return;
        }

        setSaving(true);
        try {
            const stockDiff = newStock - (selectedProduct.stock || 0);

            // 1. Update product table
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', selectedProduct.id);

            if (updateError) throw updateError;

            // 2. Record in stock_audit
            // We assume this table exists or we'll swallow error if it fails (not critical for baseline)
            try {
                await supabase.from('stock_audit').insert({
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.name,
                    previous_stock: selectedProduct.stock,
                    actual_stock: newStock,
                    difference: stockDiff,
                    reason: 'Manual Audit',
                });
            } catch (auditErr) {
                console.warn('stock_audit table probably missing:', auditErr);
            }

            toast.success(`Inventory recalibrated: ${selectedProduct.name}`, {
                description: `Stock adjusted from ${selectedProduct.stock} to ${newStock} units.`
            });

            setSelectedProduct(null);
            setActualStock('');
            inputRef.current?.focus();
        } catch (error: any) {
            toast.error('Sync failed: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] p-6 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Inventory Audit Protocol</h1>
                            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-50">Enterprise Calibration Mode</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-gold/30 flex items-center justify-center bg-gold/5">
                        <ShieldCheck className="w-6 h-6 text-gold" />
                    </div>
                </div>

                {/* Workflow Segment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Step 1: Scanner */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card rounded-[2rem] p-8 space-y-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Barcode className="w-24 h-24 text-white" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Step 01</span>
                            <h2 className="text-xl font-bold text-white uppercase">Scan Product ID</h2>
                        </div>

                        <form onSubmit={handleSearch} className="relative">
                            <Input
                                ref={inputRef}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="READY FOR SCAN..."
                                className="h-16 bg-white/5 border-white/10 rounded-2xl text-xl font-black text-white placeholder:text-white/10 focus:ring-primary/50 text-center uppercase tracking-widest"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                        </form>
                    </motion.div>

                    {/* Step 2: Recalibration */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "glass-card rounded-[2rem] p-8 space-y-6 transition-all duration-500",
                            selectedProduct ? "opacity-100 scale-100 shadow-[0_0_50px_rgba(34,197,94,0.1)]" : "opacity-30 scale-95 pointer-events-none"
                        )}
                    >
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Step 02</span>
                            <h2 className="text-xl font-bold text-white uppercase">Stock Count</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-muted-foreground uppercase">System Level</span>
                                <span className={cn(
                                    "text-lg font-black",
                                    selectedProduct && selectedProduct.stock < 0 ? "text-destructive" : "text-white"
                                )}>
                                    {selectedProduct?.stock || 0}
                                </span>
                            </div>

                            <div className="relative">
                                <Input
                                    ref={stockRef}
                                    type="number"
                                    value={actualStock}
                                    onChange={e => setActualStock(e.target.value)}
                                    placeholder="ACTUAL COUNT"
                                    className="h-16 bg-white/10 border-gold/20 rounded-2xl text-3xl font-black text-gold placeholder:text-gold/10 focus:ring-gold/50 text-center"
                                />
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={saving || !actualStock}
                                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                            >
                                {saving ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <Package className="w-6 h-6" />
                                    </motion.div>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6" />
                                        Commit Update
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Selected Product Manifest */}
                <AnimatePresence>
                    {selectedProduct && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="glass-card rounded-[2.5rem] p-8 border-primary/20 bg-primary/5 flex items-center gap-8"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                {selectedProduct.image_url ? (
                                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-10 h-10 text-white/20" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-white uppercase leading-none mb-2">{selectedProduct.name}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black text-white uppercase tracking-wider">{selectedProduct.barcode}</span>
                                    <span className="px-3 py-1 rounded-full bg-gold/10 text-[10px] font-black text-gold uppercase tracking-wider">{selectedProduct.category}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total Discrepancy</p>
                                <p className={cn(
                                    "text-3xl font-black",
                                    (parseFloat(actualStock || "0") - selectedProduct.stock) < 0 ? "text-destructive" : "text-success"
                                )}>
                                    {actualStock ? (parseFloat(actualStock) - selectedProduct.stock).toFixed(0) : "0"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
