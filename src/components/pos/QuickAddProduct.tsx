import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

interface QuickAddProductProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillBarcode?: string;
  prefillName?: string;
  onProductAdded: (product: DbProduct) => void;
}

const CATEGORIES = [
  'General', 'Beverages', 'Dairy', 'Snacks', 'Bakery',
  'Canned', 'Frozen', 'Cleaning', 'Personal Care', 'Produce', 'Meat', 'Uncategorized'
];

export default function QuickAddProduct({
  open, onOpenChange, prefillBarcode, prefillName, onProductAdded
}: QuickAddProductProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '1',
    category: 'General',
  });

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setForm({
        name: prefillName || '',
        barcode: prefillBarcode || '',
        price: '',
        stock: '1',
        category: 'General',
      });
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Selling price is required'); return; }

    setSaving(true);
    try {
      // Only insert columns that ACTUALLY EXIST in the database
      const { data, error } = await supabase.from('products').insert({
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        category: form.category,
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
      <DialogContent className="max-w-md">
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
          <div className="space-y-1">
            <Label className="text-xs">Product Name *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pepsi 500ml"
              autoFocus
            />
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

          {/* Price & Stock */}
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
              <Label className="text-xs">Current Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-2 h-12 text-base font-bold">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</>
              : <><Plus className="w-4 h-4 mr-2" />Add & Add to Cart</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
