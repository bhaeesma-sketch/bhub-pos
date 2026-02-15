import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Percent, Package, ShoppingCart, BookOpen, Printer, DoorOpen, Wifi, WifiOff, HardDrive, LogOut, ShieldAlert, AlertTriangle, Scale, Crown, PauseCircle, Play, Tag, ArrowLeft } from 'lucide-react';
import Fuse from 'fuse.js';
import { useProducts, useCustomers, useCategories } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { saveOfflineTransaction, getOfflineTransactionCount, startBackgroundSync } from '@/lib/offlineDb';
import type { Tables } from '@/integrations/supabase/types';
import PinLogin, { type StaffSession } from '@/components/pos/PinLogin';
import { useStaffSession } from '@/contexts/StaffContext';
import CameraScanner from '@/components/pos/CameraScanner';
import ProductGrid from '@/components/pos/ProductGrid';
import QuickAddProduct from '@/components/pos/QuickAddProduct';
import HeldSalesPanel, { type HeldSale } from '@/components/pos/HeldSales';
import { supabase } from '@/integrations/supabase/client';
import vaultVideo from '@/assets/vault-opening.mp4';
import logoIcon from '@/assets/logo-icon.png';

type DbProduct = Tables<'products'>;
type DbCustomer = Tables<'customers'>;

interface CartItem {
  product: DbProduct;
  quantity: number;
  discount: number;
}

// Category color map for product cards
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

const COLUMNS = { sm: 2, md: 3, lg: 4, xl: 5 };
const ROW_HEIGHT = 210; // approximate card height in px

// Parse Price-Embedded Barcodes (Prefix 20) — CAS CL5200 scale format
// Format: 20PPPPPVVVVVC where P=product code (5 digits), V=price (5 digits, 3 decimal), C=check
const parseWeighBarcode = (barcode: string): { productCode: string; totalPrice: number } | null => {
  if (!barcode || barcode.length < 13 || !barcode.startsWith('20')) return null;
  const productCode = barcode.substring(2, 7); // digits 3-7
  const priceRaw = barcode.substring(7, 12);   // digits 8-12
  const totalPrice = parseInt(priceRaw, 10) / 1000; // 3 decimal places (OMR)
  if (isNaN(totalPrice) || totalPrice <= 0) return null;
  return { productCode, totalPrice };
};

const POS = () => {
  const { staffSession, setStaffSession } = useStaffSession();
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts();
  const { data: dbCustomers = [] } = useCustomers();
  const categories = useCategories();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showKhat, setShowKhat] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [showOwnerOverride, setShowOwnerOverride] = useState(false);
  const [overridePin, setOverridePin] = useState('');
  const [pendingCheckoutMethod, setPendingCheckoutMethod] = useState<string | null>(null);
  const [showAdminToggle, setShowAdminToggle] = useState(false);
  const [adminTogglePin, setAdminTogglePin] = useState('');
  const [showVaultAnimation, setShowVaultAnimation] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick Add Product state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddName, setQuickAddName] = useState('');

  // Hold/Recall Sale state
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);

  // Item-level discount editing
  const [editingItemDiscount, setEditingItemDiscount] = useState<string | null>(null);

  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [editQuantityValue, setEditQuantityValue] = useState('');

  // Mobile Cart Toggle
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Long-press logo handler for admin quick-toggle
  const handleLogoTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowVaultAnimation(true);
      // Play vault animation for 3 seconds then show PIN pad
      setTimeout(() => {
        setShowVaultAnimation(false);
        setShowAdminToggle(true);
      }, 3000);
    }, 3000); // 3 second long press
  }, []);

  const handleLogoTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleAdminTogglePin = useCallback(async (pin: string) => {
    const { data } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('pin', pin)
      .eq('role', 'owner')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setStaffSession({ id: data.id, name: data.name, role: 'owner' });
      setShowAdminToggle(false);
      setAdminTogglePin('');
      toast.success(`👑 Admin mode activated — Welcome, ${data.name}`, { duration: 2000 });
      // Log the admin switch
      supabase.from('staff_alerts').insert({
        staff_id: data.id,
        staff_name: data.name,
        action: 'admin_toggle',
        details: `Quick-switched to Admin mode via logo long-press`,
      }).then(() => { });
    } else {
      toast.error('Invalid Owner PIN');
      setAdminTogglePin('');
    }
  }, []);

  // Online/offline status
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Background sync engine
  useEffect(() => {
    const stop = startBackgroundSync(15000);
    return stop;
  }, []);

  // Check pending sync count periodically
  useEffect(() => {
    const check = async () => {
      const count = await getOfflineTransactionCount();
      setPendingSync(count);
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Fuse.js index for bilingual fuzzy search across 40K+ products
  const fuse = useMemo(() => new Fuse(dbProducts, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'name_ar', weight: 0.5 },
      { name: 'barcode', weight: 0.3 },
      { name: 'sku', weight: 0.2 },
    ],
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
  }), [dbProducts]);

  // Bilingual fuzzy search — no cap, virtual scrolling handles rendering
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim();

    if (!q) {
      return activeCategory === 'All Items'
        ? dbProducts
        : dbProducts.filter(p => p.category === activeCategory);
    }

    // Exact barcode match first
    const exactBarcode = dbProducts.find(p => p.barcode === q);
    if (exactBarcode) return [exactBarcode];

    // Fuzzy search
    const fuseResults = fuse.search(q);
    let results = fuseResults.map(r => r.item);
    if (activeCategory !== 'All Items') {
      results = results.filter(p => p.category === activeCategory);
    }
    return results;
  }, [searchQuery, activeCategory, dbProducts, fuse]);

  const addToCart = useCallback((product: DbProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  }, []);

  // Add weighted item from scale barcode
  const addWeighedItem = useCallback((product: DbProduct, totalPrice: number) => {
    if (product.price <= 0) {
      toast.error(`Cannot calculate weight: ${product.name} has no price set`);
      return;
    }
    const weight = totalPrice / product.price;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.round((item.quantity + weight) * 1000) / 1000 }
            : item
        );
      }
      return [...prev, { product, quantity: Math.round(weight * 1000) / 1000, discount: 0 }];
    });
    toast.success(`⚖️ ${product.name}: ${weight.toFixed(3)} kg = OMR ${totalPrice.toFixed(3)}`, { duration: 2000 });
  }, []);

  // Process barcode: prefix-20 weigh barcodes + regular + name fallback
  const processBarcodeInput = useCallback((barcode: string): boolean => {
    const weighed = parseWeighBarcode(barcode);
    if (weighed) {
      const match = dbProducts.find(p =>
        p.barcode && (p.barcode === weighed.productCode || p.barcode.endsWith(weighed.productCode))
      );
      if (match) {
        addWeighedItem(match, weighed.totalPrice);
        return true;
      }
      toast.error(`Weighed barcode: product code "${weighed.productCode}" not found. Price: OMR ${weighed.totalPrice.toFixed(3)}`);
      return true;
    }
    // Exact barcode match
    const exactMatch = dbProducts.find(p => p.barcode === barcode);
    if (exactMatch) {
      addToCart(exactMatch);
      toast.success(`✓ Scanned: ${exactMatch.name}`, { duration: 1500 });
      return true;
    }
    // Fallback: try exact name match (case-insensitive)
    const nameMatch = dbProducts.find(p => p.name.toLowerCase() === barcode.toLowerCase());
    if (nameMatch) {
      addToCart(nameMatch);
      toast.success(`✓ Found by name: ${nameMatch.name}`, { duration: 1500 });
      return true;
    }
    // Fallback: partial name match — only if both strings are meaningful length (>=4 chars)
    const barcodeLC = barcode.toLowerCase();
    if (barcodeLC.length >= 4) {
      const partialMatch = dbProducts.find(p => {
        const nameLC = p.name.toLowerCase();
        if (nameLC.length < 4) return false; // skip junk entries like "1", "fa", etc.
        return nameLC.includes(barcodeLC) || barcodeLC.includes(nameLC);
      });
      if (partialMatch) {
        addToCart(partialMatch);
        toast.success(`✓ Partial match: ${partialMatch.name}`, { duration: 1500 });
        return true;
      }
    }
    // Fallback: fuzzy search — add the top match if it's strong enough
    const fuseHits = fuse.search(barcode, { limit: 5 });
    if (fuseHits.length > 0 && (fuseHits[0].score ?? 1) < 0.35) {
      addToCart(fuseHits[0].item);
      toast.success(`✓ Best match: ${fuseHits[0].item.name}`, { duration: 1500 });
      return true;
    }
    return false;
  }, [dbProducts, addToCart, addWeighedItem, fuse]);

  // Barcode scanner: Enter key
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      if (processBarcodeInput(query)) {
        setSearchQuery('');
        return;
      }

      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
        toast.success(`✓ Added: ${filteredProducts[0].name}`, { duration: 1500 });
        return;
      }

      if (filteredProducts.length === 0) {
        // Open Quick Add dialog with the search term as name hint
        setQuickAddBarcode('');
        setQuickAddName(query);
        setQuickAddOpen(true);
        setSearchQuery('');
      }
    }
  }, [searchQuery, filteredProducts, addToCart, processBarcodeInput]);

  // Camera scan handler — supports prefix-20 weigh barcodes + regular
  const handleCameraScan = useCallback((barcode: string) => {
    if (processBarcodeInput(barcode)) return;

    // Not found — open Quick Add Product dialog with prefilled barcode
    setQuickAddBarcode(barcode);
    setQuickAddName('');
    setQuickAddOpen(true);
  }, [processBarcodeInput]);

  // Quick add product callback — auto-add to cart
  const handleQuickProductAdded = useCallback((product: DbProduct) => {
    addToCart(product);
  }, [addToCart]);

  // Hold current sale
  const holdCurrentSale = useCallback(() => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const held: HeldSale = {
      id: `HOLD-${Date.now()}`,
      cart: [...cart],
      customer: selectedCustomer,
      customerId: selectedCustomerId,
      heldAt: new Date().toISOString(),
      note: '',
    };
    setHeldSales(prev => [...prev, held]);
    clearCart();
    toast.success(`Sale parked (${held.cart.length} items)`, { description: 'Tap 🔄 to recall', duration: 2000 });
  }, [cart, selectedCustomer, selectedCustomerId]);

  // Recall a held sale
  const recallHeldSale = useCallback((sale: HeldSale) => {
    if (cart.length > 0) {
      // Park current cart first
      const currentHeld: HeldSale = {
        id: `HOLD-${Date.now()}`,
        cart: [...cart],
        customer: selectedCustomer,
        customerId: selectedCustomerId,
        heldAt: new Date().toISOString(),
        note: '(auto-parked)',
      };
      setHeldSales(prev => [...prev.filter(s => s.id !== sale.id), currentHeld]);
    } else {
      setHeldSales(prev => prev.filter(s => s.id !== sale.id));
    }
    setCart(sale.cart);
    setSelectedCustomer(sale.customer);
    setSelectedCustomerId(sale.customerId);
    setShowHeldSales(false);
    toast.success(`Recalled sale for ${sale.customer}`, { duration: 1500 });
  }, [cart, selectedCustomer, selectedCustomerId]);

  const deleteHeldSale = useCallback((id: string) => {
    setHeldSales(prev => prev.filter(s => s.id !== id));
    toast.success('Held sale deleted');
  }, []);

  // Update item discount
  const updateItemDiscount = useCallback((productId: string, discount: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, discount: Math.max(0, Math.min(100, discount)) } : item
    ));
  }, []);

  // Set exact quantity
  const setExactQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      if (qty > item.product.stock) { toast.error('Not enough stock'); return item; }
      return { ...item, quantity: qty };
    }));
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.product.stock) { toast.error('Not enough stock'); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    if (isStaffOnly) {
      const item = cart.find(i => i.product.id === productId);
      toast.error('Staff cannot remove items. Owner has been notified.');
      // Log alert to DB for owner
      supabase.from('staff_alerts').insert({
        staff_id: staffSession.id,
        staff_name: staffSession.name,
        action: 'delete_item',
        details: `Tried to remove "${item?.product.name || 'Unknown'}" from cart`,
      }).then(() => { });
      return;
    }
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };
  const clearCart = () => { setCart([]); setCartDiscount(0); setSelectedCustomer('Walk-in Customer'); setSelectedCustomerId(null); };

  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.product.price * item.quantity;
    const itemDiscountAmt = (itemTotal * item.discount) / 100;
    return sum + (itemTotal - itemDiscountAmt);
  }, 0);
  const discountAmount = (subtotal * cartDiscount) / 100;
  const taxAmount = (subtotal - discountAmount) * 0.05;
  const total = subtotal - discountAmount + taxAmount;

  // Hardware placeholders
  const kickDrawer = (isSaleRelated = false) => {
    toast.success('🔓 Cash drawer opened', {
      description: 'ESC/POS command 0x1B 0x70 sent to Epson TM-T88VII',
      duration: 2000,
    });
    // Log non-sale drawer opens for audit
    if (!isSaleRelated && staffSession) {
      supabase.from('staff_alerts').insert({
        staff_id: staffSession.id,
        staff_name: staffSession.name,
        action: 'drawer_open_no_sale',
        details: `Opened cash drawer without a sale (manual open)`,
      }).then(() => { });
    }
  };

  const printReceipt = () => {
    toast.success('🖨️ Receipt printing...', {
      description: 'Sending to thermal printer via LAN/USB',
      duration: 2000,
    });
  };

  // Check for below-cost items
  const belowCostItems = cart.filter(i => i.product.price < i.product.cost);

  const initiateCheckout = (method: string) => {
    if (belowCostItems.length > 0 && staffSession?.role !== 'owner') {
      // Staff/manager needs owner override for below-cost sales
      setPendingCheckoutMethod(method);
      setShowOwnerOverride(true);
      toast.error('Some items are priced below cost! Owner PIN required.', { duration: 3000 });
      return;
    }
    executeCheckout(method);
  };

  const handleOwnerOverride = async (pinToCheck?: string) => {
    const pin = pinToCheck || overridePin;
    const { data } = await supabase
      .from('staff')
      .select('role')
      .eq('pin', pin)
      .eq('role', 'owner')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setShowOwnerOverride(false);
      setOverridePin('');
      if (pendingCheckoutMethod) {
        executeCheckout(pendingCheckoutMethod);
        setPendingCheckoutMethod(null);
      }
    } else {
      toast.error('Invalid owner PIN');
      setOverridePin('');
    }
  };

  const executeCheckout = async (method: string) => {
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
    setLastInvoice(invoiceNo);

    // Save to IndexedDB (offline-first) — will sync to Supabase
    await saveOfflineTransaction({
      id: invoiceNo,
      cart: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        cost: i.product.cost,
        total: i.product.price * i.quantity,
        barcode: i.product.barcode || undefined,
      })),
      customer: selectedCustomer,
      customerId: selectedCustomerId || undefined,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod: method,
      invoiceNo,
      createdAt: new Date().toISOString(),
      synced: false,
    });

    if (method === 'Cash') kickDrawer(true);

    if (method === 'Credit') {
      toast.success(`Credit sale of OMR ${total.toFixed(3)} recorded for ${selectedCustomer}`, {
        description: `Added to Khat ledger • ${invoiceNo}`,
      });
    } else {
      toast.success(`Payment of OMR ${total.toFixed(3)} received via ${method}`, {
        description: `Invoice ${invoiceNo} for ${selectedCustomer}`,
      });
    }

    setShowQR(true);
    setTimeout(() => { clearCart(); setShowQR(false); }, 4000);
  };

  // Khat customers — those with debt
  const khatCustomers = dbCustomers.filter(c => c.total_debt > 0);

  // PIN gate
  if (!staffSession) {
    return <PinLogin onLogin={setStaffSession} />;
  }

  const isStaffOnly = staffSession.role === 'staff';
  const handleLogout = () => { setStaffSession(null); clearCart(); };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Package className="w-12 h-12 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  const isOwner = staffSession.role === 'owner';
  const roleBorderClass = isOwner
    ? 'ring-2 ring-gold/40 shadow-[0_0_30px_-5px_hsl(var(--gold)/0.3)]'
    : 'ring-2 ring-info/40 shadow-[0_0_30px_-5px_hsl(var(--info)/0.3)]';

  return (
    <>
      <div className={cn("flex h-screen overflow-hidden rounded-lg flex-col", roleBorderClass)}>
        {/* ═══ MODE BANNER ═══ */}
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          className={cn(
            "flex items-center justify-center gap-3 py-1.5 text-xs font-bold tracking-[0.25em] uppercase select-none relative overflow-hidden shrink-0",
            isOwner
              ? "bg-gradient-to-r from-gold/30 via-gold/20 to-gold/30 text-gold border-b border-gold/30"
              : "bg-gradient-to-r from-info/20 via-info/10 to-info/20 text-info border-b border-info/20"
          )}
        >
          {/* Animated shimmer */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            className={cn(
              "absolute inset-y-0 w-1/3 opacity-20",
              isOwner ? "bg-gradient-to-r from-transparent via-gold to-transparent" : "bg-gradient-to-r from-transparent via-info to-transparent"
            )}
          />
          {isOwner ? (
            <>
              <Crown className="w-4 h-4" />
              <span>Admin Mode — Full Access</span>
              <Crown className="w-4 h-4" />
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Staff Mode — Restricted Access</span>
              <ShieldAlert className="w-4 h-4" />
            </>
          )}
        </motion.div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: Products */}
          <div className={cn("flex-1 flex flex-col min-w-0", showKhat && "hidden lg:flex", mobileCartOpen ? "hidden md:flex" : "flex")}>
            {/* Search Bar */}
            <div className="p-2 sm:p-4 border-b border-border/50 glass-strong">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Long-press logo for admin toggle */}
                <button
                  onMouseDown={handleLogoTouchStart}
                  onMouseUp={handleLogoTouchEnd}
                  onMouseLeave={handleLogoTouchEnd}
                  onTouchStart={handleLogoTouchStart}
                  onTouchEnd={handleLogoTouchEnd}
                  className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative select-none"
                  title="BHAEES POS"
                >
                  <img src={logoIcon} alt="BHAEES" className="w-full h-full object-cover" />
                  {isOwner && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <Crown className="w-3 h-3 text-gold" />
                    </div>
                  )}
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Scan barcode or search / البحث عن المنتجات... ⏎"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                <CameraScanner onScan={handleCameraScan} />
                <button
                  onClick={() => { setQuickAddBarcode(''); setQuickAddName(''); setQuickAddOpen(true); }}
                  className="p-2.5 rounded-lg glass border border-input text-muted-foreground hover:text-success hover:border-success/50 transition-all"
                  title="Quick Add New Product"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className={cn("hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs font-medium", online ? 'text-success' : 'text-warning')}>
                  {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  {online ? 'Online' : 'Offline'}
                  {pendingSync > 0 && (
                    <span className="ml-1 flex items-center gap-1 text-warning">
                      <HardDrive className="w-3 h-3" /> {pendingSync}
                    </span>
                  )}
                </div>
                <div className={cn("hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-medium text-foreground", isOwner ? 'ring-1 ring-gold/30' : 'ring-1 ring-info/30')}>
                  {isOwner && <Crown className="w-3 h-3 text-gold" />}
                  <span className={isOwner ? 'text-gold' : 'text-info'}>{staffSession.name}</span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider", isOwner ? 'bg-gold/20 text-gold' : 'bg-info/20 text-info')}>
                    {staffSession.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    "bg-destructive/15 text-destructive border border-destructive/30",
                    "hover:bg-destructive hover:text-destructive-foreground hover:scale-105 active:scale-95"
                  )}
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b border-border/50 glass overflow-x-auto">
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                      activeCategory === cat
                        ? 'gradient-cyan text-primary-foreground glow-cyan'
                        : 'glass text-secondary-foreground hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid — Virtual Scrolling */}
            <ProductGrid products={filteredProducts} addToCart={addToCart} />
          </div>

          {/* Digital Khat Sidebar */}
          <AnimatePresence>
            {showKhat && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-border/50 glass-strong flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-border/50">
                  <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Digital Khat (Daftar)
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 pos-scrollbar">
                  {khatCustomers.map(c => (
                    <div key={c.id} className="glass rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground capitalize">{c.name}</span>
                        <span className={cn(
                          'text-xs font-bold',
                          c.total_debt > 50 ? 'text-destructive' : c.total_debt > 5 ? 'text-warning' : 'text-success'
                        )}>
                          <span className="text-gold">OMR</span> {Number(c.total_debt).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn(
                          'h-full rounded-full transition-all',
                          c.total_debt > 50 ? 'debt-gauge-red' : c.total_debt > 5 ? 'debt-gauge-yellow' : 'debt-gauge-green'
                        )} style={{ width: `${Math.min((Number(c.total_debt) / 400) * 100, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{c.phone || '—'}</span>
                        {c.phone && (
                          <a
                            href={`https://wa.me/${c.phone.replace('+', '')}?text=${encodeURIComponent(`Hi ${c.name}, this is a friendly reminder from BHAEES POS. Your outstanding balance is OMR ${Number(c.total_debt).toFixed(3)}. Thank you!`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-success hover:underline"
                          >
                            WhatsApp ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {khatCustomers.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8">No outstanding debts</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Cart */}
          <div className={cn("w-full md:w-[380px] border-l border-border/50 glass-strong flex flex-col transition-all duration-300", mobileCartOpen ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl md:static md:bg-transparent md:z-auto" : "hidden md:flex")}>
            {/* Cart Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileCartOpen(false)}
                    className="md:hidden p-1.5 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/20"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-bold font-heading text-foreground">Current Sale</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Hold Sale */}
                  <button
                    onClick={holdCurrentSale}
                    disabled={cart.length === 0}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors disabled:opacity-30"
                    title="Hold/Park Sale"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                  {/* Recall Held Sales */}
                  <button
                    onClick={() => setShowHeldSales(!showHeldSales)}
                    className={cn('p-1.5 rounded-lg transition-colors relative', showHeldSales ? 'bg-success/20 text-success' : 'text-muted-foreground hover:text-success hover:bg-success/10')}
                    title={`Recall Held Sale (${heldSales.length})`}
                  >
                    <Play className="w-4 h-4" />
                    {heldSales.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning text-warning-foreground text-[9px] font-bold flex items-center justify-center">
                        {heldSales.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => kickDrawer(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 transition-colors" title="Open Cash Drawer (ESC/POS)">
                    <DoorOpen className="w-4 h-4" />
                  </button>
                  <button onClick={printReceipt} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Print Receipt (Epson TM-T88VII)">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowKhat(!showKhat)}
                    className={cn('p-1.5 rounded-lg transition-colors', showKhat ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
                    title="Digital Khat"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-xs text-destructive hover:underline">Clear</button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-input text-sm text-foreground hover:bg-muted/30 transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{selectedCustomer}</span>
              </button>
              <AnimatePresence>
                {showCustomerPicker && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                    <div className="glass rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto pos-scrollbar">
                      <button onClick={() => { setSelectedCustomer('Walk-in Customer'); setSelectedCustomerId(null); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors text-foreground">Walk-in Customer</button>
                      {dbCustomers.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCustomer(c.name); setSelectedCustomerId(c.id); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors text-foreground">{c.name} — {c.phone || '—'}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Held Sales Panel */}
            <AnimatePresence>
              {showHeldSales && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border/50 overflow-hidden">
                  <HeldSalesPanel
                    heldSales={heldSales}
                    onRecall={recallHeldSale}
                    onDelete={deleteHeldSale}
                    onClose={() => setShowHeldSales(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pos-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs mt-1">Scan a barcode or tap a product</p>
                  {/* Quick add product button */}
                  <button
                    onClick={() => { setQuickAddBarcode(''); setQuickAddName(''); setQuickAddOpen(true); }}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Product
                  </button>
                </div>
              ) : (
                cart.map(item => {
                  const itemTotal = item.product.price * item.quantity;
                  const itemDiscountAmt = (itemTotal * item.discount) / 100;
                  const itemFinal = itemTotal - itemDiscountAmt;
                  return (
                    <motion.div key={item.product.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-lg glass space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-gold">OMR</span> {item.product.price.toFixed(3)} × {item.quantity}
                            {item.discount > 0 && <span className="text-success ml-1">(-{item.discount}%)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                            <Minus className="w-3 h-3 text-foreground" />
                          </button>
                          {/* Tap to edit quantity */}
                          {editingQuantity === item.product.id ? (
                            <input
                              type="number"
                              className="w-10 text-center text-xs font-semibold bg-transparent border border-primary rounded px-0.5 py-0.5 text-foreground focus:outline-none"
                              value={editQuantityValue}
                              onChange={e => setEditQuantityValue(e.target.value)}
                              onBlur={() => {
                                const q = Number(editQuantityValue);
                                if (q > 0) setExactQuantity(item.product.id, q);
                                setEditingQuantity(null);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const q = Number(editQuantityValue);
                                  if (q > 0) setExactQuantity(item.product.id, q);
                                  setEditingQuantity(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => { setEditingQuantity(item.product.id); setEditQuantityValue(String(item.quantity)); }}
                              className="w-7 text-center text-xs font-semibold text-foreground hover:text-primary transition-colors"
                              title="Tap to edit quantity"
                            >
                              {item.quantity}
                            </button>
                          )}
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                            <Plus className="w-3 h-3 text-foreground" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-gold w-16 text-right">OMR {itemFinal.toFixed(3)}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Item-level discount toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingItemDiscount(editingItemDiscount === item.product.id ? null : item.product.id)}
                          className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors',
                            item.discount > 0 ? 'bg-success/20 text-success' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {item.discount > 0 ? `${item.discount}% off` : 'Discount'}
                        </button>
                        {editingItemDiscount === item.product.id && (
                          <input
                            type="number"
                            className="w-14 text-[10px] bg-transparent border border-input rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="%"
                            value={item.discount || ''}
                            onChange={e => updateItemDiscount(item.product.id, Number(e.target.value))}
                            min={0} max={100}
                            autoFocus
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* QR Code Display */}
            <AnimatePresence>
              {showQR && lastInvoice && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="p-4 border-t border-border/50 text-center">
                  <p className="text-xs text-muted-foreground mb-2">OTA-Compliant VAT Receipt QR</p>
                  <div className="inline-block p-3 rounded-lg bg-foreground">
                    <QRCodeSVG
                      value={JSON.stringify({ seller: 'BHAEES POS', vat: 'OM1234567890', invoice: lastInvoice, total: total.toFixed(3), date: new Date().toISOString() })}
                      size={120}
                      bgColor="hsl(180, 100%, 95%)"
                      fgColor="hsl(0, 0%, 2%)"
                    />
                  </div>
                  <p className="text-[10px] text-primary mt-2 font-mono">{lastInvoice}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Summary */}
            {cart.length > 0 && !showQR && (
              <div className="border-t border-border/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Discount %"
                    value={cartDiscount || ''}
                    onChange={(e) => {
                      if (isStaffOnly) { toast.error('Staff cannot change discount'); return; }
                      setCartDiscount(Number(e.target.value));
                    }}
                    disabled={isStaffOnly}
                    className="flex-1 px-2 py-1.5 rounded glass text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    min={0} max={100}
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span><span className="text-gold">OMR</span> {subtotal.toFixed(3)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount ({cartDiscount}%)</span>
                      <span>-OMR {discountAmount.toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT (5%)</span>
                    <span>OMR {taxAmount.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span className="text-gold text-glow">OMR {total.toFixed(3)}</span>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => initiateCheckout('Cash')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-success text-success-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                    <Banknote className="w-4 h-4" /> Cash
                  </button>
                  <button onClick={() => initiateCheckout('Card')} className="flex items-center justify-center gap-2 py-3 rounded-lg gradient-cyan text-primary-foreground hover:opacity-90 transition-opacity font-medium text-xs glow-cyan">
                    <CreditCard className="w-4 h-4" /> Card
                  </button>
                  <button onClick={() => initiateCheckout('Digital')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-info text-info-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                    <Smartphone className="w-4 h-4" /> Digital
                  </button>
                  <button onClick={() => initiateCheckout('Credit')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-warning text-warning-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                    <BookOpen className="w-4 h-4" /> Credit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Owner Override Modal for Below-Cost Sales */}
          <AnimatePresence>
            {showOwnerOverride && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="glass-card rounded-2xl p-6 w-full max-w-xs mx-4 text-center space-y-4"
                >
                  <ShieldAlert className="w-10 h-10 mx-auto text-destructive" />
                  <h3 className="text-sm font-bold font-heading text-foreground">Below-Cost Sale Detected</h3>
                  <div className="space-y-1">
                    {belowCostItems.map(i => (
                      <p key={i.product.id} className="text-[10px] text-destructive">
                        {i.product.name}: price OMR {i.product.price.toFixed(3)} &lt; cost OMR {Number(i.product.cost).toFixed(3)}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Enter Owner PIN to approve</p>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={cn(
                        'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold',
                        overridePin.length > i ? 'border-primary text-primary' : 'border-border text-transparent'
                      )}>
                        {overridePin.length > i ? '•' : ''}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
                      key !== null ? (
                        <button
                          key={i}
                          onClick={() => {
                            if (key === 'del') {
                              setOverridePin(prev => prev.slice(0, -1));
                            } else {
                              const newPin = overridePin + key;
                              setOverridePin(newPin);
                              if (newPin.length === 4) {
                                setTimeout(() => handleOwnerOverride(newPin), 200);
                              }
                            }
                          }}
                          className="h-10 rounded-lg glass text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {key === 'del' ? '⌫' : key}
                        </button>
                      ) : <div key={i} />
                    )}
                  </div>
                  <button
                    onClick={() => { setShowOwnerOverride(false); setOverridePin(''); setPendingCheckoutMethod(null); }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div> {/* end flex-1 wrapper */}

        {/* Mobile Cart Floating Action Button */}
        {!mobileCartOpen && cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="md:hidden fixed bottom-4 left-4 right-4 z-40"
          >
            <button
              onClick={() => setMobileCartOpen(true)}
              className="w-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/20 rounded-xl p-4 flex items-center justify-between font-bold"
            >
              <div className="flex items-center gap-2">
                <div className="bg-black/20 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">{cart.reduce((a, b) => a + b.quantity, 0)} items</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wider text-sm">View Cart</span>
                <span className="bg-black/20 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">OMR {total.toFixed(3)}</span>
              </div>
            </button>
          </motion.div>
        )}

      </div> {/* end main container */}

      {/* Vault Opening Animation Overlay */}
      <AnimatePresence>
        {showVaultAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            <video
              src={vaultVideo}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-12 text-center"
            >
              <p className="text-gold text-lg font-bold font-heading text-glow tracking-widest">OWNER ACCESS</p>
              <p className="text-muted-foreground text-xs mt-1">Authenticating...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Quick-Toggle PIN Pad */}
      <AnimatePresence>
        {showAdminToggle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-background/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-2xl p-8 w-full max-w-xs mx-4 text-center space-y-5 ring-2 ring-gold/30 shadow-[0_0_40px_-5px_hsl(var(--gold)/0.4)]"
            >
              <Crown className="w-10 h-10 mx-auto text-gold" />
              <h3 className="text-sm font-bold font-heading text-foreground">Owner Authentication</h3>
              <p className="text-xs text-muted-foreground">Enter Owner PIN to switch to Admin mode</p>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={adminTogglePin.length > i ? { scale: [1, 1.2, 1] } : {}}
                    className={cn(
                      'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all',
                      adminTogglePin.length > i
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border/50 text-transparent'
                    )}
                  >
                    {adminTogglePin.length > i ? '•' : ''}
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
                  key !== null ? (
                    <button
                      key={i}
                      onClick={() => {
                        if (key === 'del') {
                          setAdminTogglePin(prev => prev.slice(0, -1));
                        } else {
                          const newPin = adminTogglePin + key;
                          if (newPin.length <= 4) {
                            setAdminTogglePin(newPin);
                            if (newPin.length === 4) {
                              setTimeout(() => handleAdminTogglePin(newPin), 200);
                            }
                          }
                        }
                      }}
                      className="h-12 rounded-xl glass text-base font-semibold text-foreground hover:bg-gold/10 hover:text-gold transition-all"
                    >
                      {key === 'del' ? '⌫' : key}
                    </button>
                  ) : <div key={i} />
                )}
              </div>
              <button
                onClick={() => { setShowAdminToggle(false); setAdminTogglePin(''); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Product Dialog */}
      <QuickAddProduct
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        prefillBarcode={quickAddBarcode}
        prefillName={quickAddName}
        onProductAdded={handleQuickProductAdded}
      />
    </>
  );
};

export default POS;
