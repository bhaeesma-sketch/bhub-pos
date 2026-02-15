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
const ROW_HEIGHT = 220;

interface Props {
  products: DbProduct[];
  addToCart: (product: DbProduct) => void;
}

export default function ProductGrid({ products, addToCart }: Props) {
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No products found — try searching by name or barcode
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto p-4 pos-scrollbar">
      <p className="text-[10px] text-muted-foreground mb-2 text-center">
        {products.length.toLocaleString()} products
      </p>
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            >
              {rowProducts.map((product) => {
                const catColor = getCatColor(product.category);
                const isBelowCost = product.price < product.cost;
                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'glass-card rounded-xl p-3 text-left hover:glow-cyan transition-all group h-fit',
                      isBelowCost && 'ring-1 ring-destructive/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-full aspect-[4/3] rounded-lg flex flex-col items-center justify-center mb-2 relative border overflow-hidden',
                        catColor.bg,
                        catColor.border
                      )}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover absolute inset-0"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <Package
                            className={cn('w-6 h-6 transition-colors', catColor.icon, 'group-hover:text-primary')}
                          />
                          <span className={cn('text-[8px] font-medium mt-1 uppercase tracking-wider', catColor.icon)}>
                            {product.category}
                          </span>
                        </>
                      )}
                      {product.is_weighted && (
                        <span className="absolute bottom-1 right-1 text-[8px] px-1.5 py-0.5 rounded bg-info/20 text-info font-bold flex items-center gap-0.5">
                          <Scale className="w-2.5 h-2.5" /> KG
                        </span>
                      )}
                      {product.stock <= product.min_stock && (
                        <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground font-bold">
                          LOW
                        </span>
                      )}
                      {isBelowCost && (
                        <span className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded bg-destructive/80 text-destructive-foreground font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> &lt;COST
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                      {product.name}
                    </p>
                    {product.name_ar && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1" dir="rtl">
                        {product.name_ar}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className={cn('text-sm font-bold', isBelowCost ? 'text-destructive' : 'text-gold')}>
                        OMR {product.price.toFixed(3)}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded',
                          product.stock <= product.min_stock ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                        )}
                      >
                        {product.stock}
                      </span>
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
