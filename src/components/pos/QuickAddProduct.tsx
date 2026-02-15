import { useState } from 'react';
import { Plus, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

interface QuickAddProductProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillBarcode?: string;
  prefillName?: string;
  onProductAdded: (product: DbProduct) => void;
}

const CATEGORIES = ['General', 'Beverages', 'Dairy', 'Snacks', 'Bakery', 'Canned', 'Frozen', 'Cleaning', 'Personal Care', 'Produce', 'Meat', 'Uncategorized'];

export default function QuickAddProduct({ open, onOpenChange, prefillBarcode, prefillName, onProductAdded }: QuickAddProductProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    category: 'General',
    unit: 'pcs',
    is_weighted: false,
  });

  // Reset and prefill when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setForm({
        name: prefillName || '',
        name_ar: '',
        barcode: prefillBarcode || '',
        price: '',
        cost: '',
        stock: '1',
        category: 'General',
        unit: 'pcs',
        is_weighted: false,
      });
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Selling price is required'); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase.from('products').insert({
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        barcode: form.barcode.trim() || null,
        price: Number(form.price),
        cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0,
        category: form.category,
        unit: form.unit,
        is_weighted: form.is_weighted,
        min_stock: 5,
      }).select().single();

      if (error) throw error;

      toast.success(`✅ "${data.name}" added & added to cart!`, { duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onProductAdded(data as DbProduct);
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Failed to add: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Quick Add Product
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Product not found? Add it here and it'll be added to your cart immediately.
        </p>

        <div className="grid gap-3 py-2">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pepsi 500ml"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Name (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                placeholder="الاسم بالعربي"
              />
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-1">
            <Label className="text-xs">Barcode</Label>
            <Input
              value={form.barcode}
              onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
              placeholder="Scanned or manual barcode"
              className="font-mono"
            />
          </div>

          {/* Price & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Selling Price (OMR) *</Label>
              <Input
                type="number"
                step="0.001"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cost (OMR)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Stock & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Current Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit & Weighted */}
          <div className="flex items-center gap-4">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Unit</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ltr">ltr</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.is_weighted} onCheckedChange={v => setForm(f => ({ ...f, is_weighted: v }))} />
              <Label className="text-xs">Weighted (KG)</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding...</> : <><Plus className="w-4 h-4 mr-2" /> Add & Add to Cart</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
