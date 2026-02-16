import { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Package, Download, Upload, Loader2, Sparkles, AlertTriangle, Zap } from 'lucide-react';
import { BulkImportModal } from '@/components/bhub/BulkImportModal';
import { useProducts, useCategories } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';
import PageTransition from '@/components/animations/PageTransition';
import ScrollReveal from '@/components/animations/ScrollReveal';
import StaggerContainer, { StaggerItem } from '@/components/animations/StaggerContainer';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const Products = () => {
  const { data: productsList = [], isLoading } = useProducts();
  const categories = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Items');
  const [importOpen, setImportOpen] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState({ done: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', name_ar: '', barcode: '', sku: '', category: 'General',
    cost: '', price: '', stock: '', min_stock: '5', unit: 'pcs',
    supplier: '', is_weighted: false, expiry_date: '',
  });

  const resetForm = () => setForm({
    name: '', name_ar: '', barcode: '', sku: '', category: 'General',
    cost: '', price: '', stock: '', min_stock: '5', unit: 'pcs',
    supplier: '', is_weighted: false, expiry_date: '',
  });

  const handleAddProduct = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Valid price is required'); return; }

    setSaving(true);
    try {
      const barcode = form.barcode.trim();

      // UPSERT LOGIC: Use onConflict to handle existing barcodes
      const { error } = await supabase.from('products').upsert({
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        barcode: barcode || null,
        sku: form.sku.trim() || null,
        category: form.category,
        cost: Number(form.cost) || 0,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 5,
        unit: form.unit,
        supplier: form.supplier.trim() || null,
        is_weighted: form.is_weighted,
        expiry_date: form.expiry_date || null,
      }, {
        onConflict: 'barcode',
        ignoreDuplicates: false
      });

      if (error) throw error;

      toast.success(barcode ? 'Product synced successfully (Upserted)' : 'Product added!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAddOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error('Error: Could not save product. Check your connection.', {
        description: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      name_ar: product.name_ar || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      category: product.category || 'General',
      cost: String(product.cost || ''),
      price: String(product.price || ''),
      stock: String(product.stock || ''),
      min_stock: String(product.min_stock || '5'),
      unit: product.unit || 'pcs',
      supplier: product.supplier || '',
      is_weighted: product.is_weighted || false,
      expiry_date: product.expiry_date || '',
    });
    setEditOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Valid price is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('products').update({
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        barcode: form.barcode.trim() || null,
        sku: form.sku.trim() || null,
        category: form.category,
        cost: Number(form.cost) || 0,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 5,
        unit: form.unit,
        supplier: form.supplier.trim() || null,
        is_weighted: form.is_weighted,
        expiry_date: form.expiry_date || null,
      }).eq('id', editingProduct.id);
      if (error) throw error;
      toast.success('Product updated!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (err: any) {
      console.error('Update failed:', err);
      toast.error('Error: Could not update product. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAudit = async (productId: string, newStock: number, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock, price: newPrice, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Audit complete: Stock & Price corrected.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      console.error('Audit failed:', err);
      toast.error('Cloud Update Failed: ' + err.message);
    }
  };

  // Generate AI images for products that don't have one
  const generateProductImages = useCallback(async () => {
    const productsWithoutImages = productsList.filter(p => !p.image_url);
    if (productsWithoutImages.length === 0) {
      toast.info('All products already have images!');
      return;
    }

    setGeneratingImages(true);
    setImageGenProgress({ done: 0, total: Math.min(productsWithoutImages.length, 50) });

    // Process in batches of 50 max per session to avoid overload
    const batch = productsWithoutImages.slice(0, 50);
    let done = 0;

    for (const product of batch) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-product-image', {
          body: { productId: product.id, productName: product.name, category: product.category },
        });

        if (error) {
          console.error(`Image gen failed for ${product.name}:`, error);
        } else {
          done++;
          setImageGenProgress({ done, total: batch.length });
        }
      } catch (err) {
        console.error(`Image gen error for ${product.name}:`, err);
      }
    }

    toast.success(`Generated ${done} product images!`);
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setGeneratingImages(false);
    setImageGenProgress({ done: 0, total: 0 });
  }, [productsList, queryClient]);

  const filtered = productsList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(searchQuery)) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.name_ar && p.name_ar.includes(searchQuery));
    const matchCat = filterCategory === 'All Items' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = productsList.filter(p => p.stock <= p.min_stock).length;
  const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // Expiry Watch: products expiring within 7 days
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nearExpiryProducts = useMemo(() => {
    return productsList.filter(p => {
      if (!p.expiry_date) return false;
      const exp = new Date(p.expiry_date);
      return exp <= sevenDaysFromNow && exp >= now;
    });
  }, [productsList, now, sevenDaysFromNow]);
  const expiredProducts = useMemo(() => {
    return productsList.filter(p => {
      if (!p.expiry_date) return false;
      return new Date(p.expiry_date) < now;
    });
  }, [productsList, now]);

  const [auditMode, setAuditMode] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Loading inventory...</p></div>;
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <ScrollReveal type="fade-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-foreground">
                <span className="text-primary text-glow">Inventory</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {productsList.length} products · {lowStock} low stock · Value: OMR {totalValue.toFixed(3)}
                {nearExpiryProducts.length > 0 && <span className="text-warning ml-2">⚠ {nearExpiryProducts.length} expiring soon</span>}
                {expiredProducts.length > 0 && <span className="text-destructive ml-2">🚫 {expiredProducts.length} expired</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditMode(!auditMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all",
                  auditMode ? "bg-warning text-warning-foreground glow-warning" : "glass text-muted-foreground hover:text-foreground"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {auditMode ? 'Audit Mode: ON' : 'Audit Tool'}
              </button>
              <button
                onClick={generateProductImages}
                disabled={generatingImages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-colors disabled:opacity-50"
              >
                {generatingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingImages ? `Generating ${imageGenProgress.done}/${imageGenProgress.total}...` : 'AI Images'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/data/stock_register.csv');
                    if (!res.ok) throw new Error('Could not find inventory file');
                    const text = await res.text();
                    toast.promise(async () => {
                      // We trigger the import via the modal's logic (or simply reload if we implement it here)
                      // For now, let's keep it simple: tell the user it's ready to import
                      setImportOpen(true);
                    }, {
                      loading: 'Reading inventory data...',
                      success: 'Data loaded. Please click Start Import.',
                      error: 'Failed to read data'
                    });
                  } catch (err) {
                    toast.error('Stock Register file not found in public/data/');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Download className="w-4 h-4" /> Sync Catalog
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
              <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="name_ar">Name (Arabic)</Label>
                        <Input id="name_ar" dir="rtl" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="الاسم بالعربي" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input id="barcode" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="e.g. 6291234567890" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. MILK-001" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c !== 'All Items').map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                            {!categories.includes('General') && <SelectItem value="General">General</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input id="supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cost">Cost (OMR)</Label>
                        <Input id="cost" type="number" step="0.001" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="price">Price (OMR) *</Label>
                        <Input id="price" type="number" step="0.001" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="min_stock">Min Stock</Label>
                        <Input id="min_stock" type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} placeholder="5" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Unit</Label>
                        <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="ltr">ltr</SelectItem>
                            <SelectItem value="box">box</SelectItem>
                            <SelectItem value="pack">pack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.is_weighted} onCheckedChange={v => setForm(f => ({ ...f, is_weighted: v }))} />
                      <Label>Weighted item (sold by KG)</Label>
                    </div>
                    <Button onClick={handleAddProduct} disabled={saving} className="w-full">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Add Product'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal type="fade-up" delay={0.1}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, barcode, SKU / البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </ScrollReveal>

        <ScrollReveal type="scale" delay={0.15}>
          <div className="glass-card rounded-xl overflow-hidden glow-cyan">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Barcode</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Cost</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((product, idx) => {
                    const isNearExpiry = product.expiry_date && new Date(product.expiry_date) <= sevenDaysFromNow && new Date(product.expiry_date) >= now;
                    const isExpired = product.expiry_date && new Date(product.expiry_date) < now;
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.6), ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        className={cn(
                          "border-b border-border/30 hover:bg-muted/10 transition-colors",
                          isExpired && "ring-2 ring-inset ring-destructive/40 bg-destructive/5",
                          isNearExpiry && !isExpired && "ring-2 ring-inset ring-warning/40 bg-warning/5"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-muted/20">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-primary" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{product.name}</span>
                              {product.name_ar && <p className="text-[10px] text-muted-foreground" dir="rtl">{product.name_ar}</p>}
                              {isExpired && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-bold mt-0.5">
                                  <AlertTriangle className="w-3 h-3" /> EXPIRED {product.expiry_date}
                                </span>
                              )}
                              {isNearExpiry && !isExpired && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-warning font-bold mt-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Expires {product.expiry_date}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{product.sku || '—'}</td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">{product.barcode || '—'}</td>
                        <td className="p-4"><Badge variant="outline" className="text-xs border-border/50">{product.category || 'General'}</Badge></td>
                        <td className="p-4 text-right text-muted-foreground">OMR {(product.cost || 0).toFixed(3)}</td>
                        <td className="p-4 text-right font-medium text-primary">
                          {auditMode ? (
                            <input
                              type="number"
                              step="0.001"
                              className="w-24 px-2 py-1 rounded bg-background border border-primary/30 text-right font-bold"
                              defaultValue={product.price}
                              onBlur={(e) => handleQuickAudit(product.id, product.stock, Number(e.target.value))}
                            />
                          ) : (
                            `OMR ${(product.price || 0).toFixed(3)}`
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {auditMode ? (
                            <input
                              type="number"
                              className="w-20 px-2 py-1 rounded bg-background border border-warning/30 text-right font-bold"
                              defaultValue={product.stock}
                              onBlur={(e) => handleQuickAudit(product.id, Number(e.target.value), product.price)}
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                                (product.stock || 0) < 0 ? 'bg-destructive animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                  (product.stock || 0) <= (product.min_stock || 0) ? 'bg-warning/20 text-warning' : 'bg-success/10 text-success'
                              )}>
                                {product.stock || 0} {product.unit || 'pcs'}
                              </span>
                              {(product.stock || 0) < 0 && (
                                <button
                                  onClick={() => handleQuickAudit(product.id, 50, product.price)}
                                  className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group"
                                  title="Quick Fix: Set to 50"
                                >
                                  <Zap className="w-3.5 h-3.5 group-active:scale-125" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditDialog(product)} className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 200 && (
              <div className="flex items-center justify-center py-3 text-muted-foreground text-xs border-t border-border/30">
                Showing 200 of {filtered.length} products. Use search to find specific items.
              </div>
            )}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No products found</div>
            )}
          </div>
        </ScrollReveal>

        {/* Edit Product Dialog */}
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditingProduct(null); resetForm(); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name_ar">Name (Arabic)</Label>
                  <Input id="edit-name_ar" dir="rtl" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="الاسم بالعربي" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-barcode">Barcode</Label>
                  <Input id="edit-barcode" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="e.g. 6291234567890" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input id="edit-sku" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. MILK-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'All Items').map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      {!categories.includes('General') && <SelectItem value="General">General</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-supplier">Supplier</Label>
                  <Input id="edit-supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cost">Cost (OMR)</Label>
                  <Input id="edit-cost" type="number" step="0.001" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-price">Price (OMR) *</Label>
                  <Input id="edit-price" type="number" step="0.001" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input id="edit-stock" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-min_stock">Min Stock</Label>
                  <Input id="edit-min_stock" type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} placeholder="5" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ltr">ltr</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-expiry">Expiry Date</Label>
                  <Input id="edit-expiry" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_weighted} onCheckedChange={v => setForm(f => ({ ...f, is_weighted: v }))} />
                <Label>Weighted item (sold by KG)</Label>
              </div>
              <Button onClick={handleEditProduct} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Update Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <BulkImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
        />
      </div>
    </PageTransition>
  );
};

export default Products;
