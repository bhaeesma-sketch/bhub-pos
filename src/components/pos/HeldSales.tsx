import { PauseCircle, Play, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

export interface HeldSale {
  id: string;
  cart: Array<{ product: DbProduct; quantity: number; discount: number }>;
  customer: string;
  customerId: string | null;
  heldAt: string;
  note: string;
}

interface HeldSalesProps {
  heldSales: HeldSale[];
  onRecall: (sale: HeldSale) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function HeldSalesPanel({ heldSales, onRecall, onDelete, onClose }: HeldSalesProps) {
  if (heldSales.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <PauseCircle className="w-10 h-10 mx-auto text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No held sales</p>
        <p className="text-xs text-muted-foreground/60">Use "Hold" to park a sale and serve another customer</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto pos-scrollbar">
      {heldSales.map(sale => {
        const total = sale.cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
        const itemCount = sale.cart.reduce((s, i) => s + i.quantity, 0);
        return (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">{sale.customer}</p>
                <p className="text-[10px] text-muted-foreground">
                  {itemCount} items · OMR {total.toFixed(3)} · {new Date(sale.heldAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {sale.note && <p className="text-[10px] text-info mt-0.5">📝 {sale.note}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onRecall(sale)}
                  className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                  title="Recall Sale"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(sale.id)}
                  className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {sale.cart.slice(0, 4).map((item, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                  {item.product.name.substring(0, 20)}{item.product.name.length > 20 ? '…' : ''} ×{item.quantity}
                </span>
              ))}
              {sale.cart.length > 4 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                  +{sale.cart.length - 4} more
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
