import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Package, Scale, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  'Beverages': { bg: 'bg-info/10', border: 'border-info/20', icon: 'text-info' },
  'Dairy': { bg: 'bg-primary/10', border: 'border-primary/20', icon: 'text-primary' },
  'Snacks': { bg: 'bg-warning/10', border: 'border-warning/20', icon: 'text-warning' },
  'Bakery': { bg: 'bg-accent/10', border: 'border-accent/20', icon: 'text-accent' },
  'Canned': { bg: 'bg-destructive/10', border: 'border-destructive/20', icon: 'text-destructive' },
  'Frozen': { bg: 'bg-info/10', border: 'border-info/20', icon: 'text-info' },
  'Cleaning': { bg: 'bg-success/10', border: 'border-success/20', icon: 'text-success' },
  'Personal Care': { bg: 'bg-primary/10', border: 'border-primary/20', icon: 'text-primary' },
  'Produce': { bg: 'bg-success/10', border: 'border-success/20', icon: 'text-success' },
  'Meat': { bg: 'bg-destructive/10', border: 'border-destructive/20', icon: 'text-destructive' },
  'Uncategorized': { bg: 'bg-muted/30', border: 'border-border/30', icon: 'text-muted-foreground' },
};
const DEFAULT_CAT_COLOR = { bg: 'bg-muted/20', border: 'border-border/20', icon: 'text-muted-foreground' };
const getCatColor = (cat: string) => CATEGORY_COLORS[cat] || DEFAULT_CAT_COLOR;

const COLS = 4; // columns in grid
const ROW_HEIGHT = 260;

interface Props {
  products: DbProduct[];
  addToCart: (product: DbProduct) => void;
  isOwner?: boolean;
}

export default function ProductGrid({ products, addToCart, isOwner = true }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const result: DbProduct[][] = [];
    for (let i = 0; i < products.length; i += COLS) {
      result.push(products.slice(i, i + COLS));
    }
    return result;
  }, [products]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-black uppercase tracking-widest opacity-20">
        No products found
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto p-4 pos-scrollbar">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowProducts = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 pb-4"
            >
              {rowProducts.map((product) => {
                const isBelowCost = isOwner && (product.price < product.cost);
                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'rounded-[1.5rem] p-4 text-left border border-slate-200 bg-white hover:border-primary/50 transition-all group h-[240px] flex flex-col shadow-sm',
                      isBelowCost && 'ring-1 ring-destructive/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-full aspect-square rounded-xl flex flex-col items-center justify-center mb-4 relative border border-slate-100 overflow-hidden bg-slate-50 shadow-inner'
                      )}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-200 group-hover:text-primary transition-colors" />
                      )}

                      {product.stock <= product.min_stock && (
                        <span className="absolute top-2 right-2 text-[8px] px-2 py-1 rounded-full bg-destructive text-white font-black shadow-lg">
                          LOW
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 uppercase line-clamp-2 leading-none mb-1">
                        {product.name}
                      </p>
                      {product.name_ar && (
                        <p className="text-[10px] font-bold text-slate-400 line-clamp-1 mb-2" dir="rtl">
                          {product.name_ar}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50 leading-none">Price</span>
                        <span className="text-lg font-black text-primary leading-none mt-1">
                          {product.price.toFixed(3)}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{product.stock} IN</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
