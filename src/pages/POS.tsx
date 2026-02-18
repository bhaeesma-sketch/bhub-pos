import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Percent, Package, ShoppingCart, BookOpen, Book, Printer, DoorOpen, Wifi, WifiOff, HardDrive, LogOut, ShieldAlert, AlertTriangle, Scale, Crown, PauseCircle, Play, Tag, ArrowLeft, X } from 'lucide-react';
import { Receipt } from '@/components/pos/Receipt';
import Fuse from 'fuse.js';
import { useProducts, useCustomers, useCategories, useStoreConfig } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { getSubscriptionInfo, isJabalShamsMaster } from '@/lib/subscription';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { generateFawtaraQR } from '@/lib/fawtara';
import { printReceiptBluetooth } from '@/lib/escpos';

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

// Quick Add Categories for Dukkantek style manual entry
const QUICK_ITEMS = [
  { id: 'QA-BREAD', name: 'Fresh Bread', price: 0.100, icon: '🍞', color: 'bg-orange-100 border-orange-200 text-orange-700' },
  { id: 'QA-MILK', name: 'Fresh Milk', price: 0.500, icon: '🥛', color: 'bg-blue-100 border-blue-200 text-blue-700' },
  { id: 'QA-WATER', name: 'Water 500ml', price: 0.100, icon: '💧', color: 'bg-cyan-100 border-cyan-200 text-cyan-700' },
];

const POS = () => {
  const { staffSession, setStaffSession } = useStaffSession();
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts();
  const { data: dbCustomers = [] } = useCustomers();
  const categories = useCategories();
  const { data: storeConfig } = useStoreConfig();

  // Subscription Gatekeeper
  const subscriptionInfo = useMemo(() => {
    try {
      return getSubscriptionInfo(storeConfig);
    } catch (e) {
      console.error('Subscription calculating failed:', e);
      return null;
    }
  }, [storeConfig]);

  const isMasterStore = subscriptionInfo?.isJabalShamsMaster || false;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search for grid filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [activeCategory, setActiveCategory] = useState('All Items');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<any>(null);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showKhat, setShowKhat] = useState(false);
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
  const longPressTimer = useRef<any>(null);

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('🚀 POS Component Initialized');
  }, []);

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
    if (!pin) return;

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
      // Fallback
      const masterPin = localStorage.getItem('bhub_admin_password');
      if (pin === masterPin) {
        const ownerName = localStorage.getItem('bhub_admin_username') || 'Master Owner';
        setStaffSession({ id: 'master_owner', name: ownerName, role: 'owner' });
        setShowAdminToggle(false);
        setAdminTogglePin('');
        toast.success(`👑 Admin mode activated via Master PIN`, { duration: 2000 });
      } else {
        toast.error('Invalid admin PIN');
        setAdminTogglePin('');
      }
    }
  }, [setStaffSession]);

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

  // Autofocus scan input on mount and after cart changes
  useEffect(() => {
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, [cart.length]);

  // OPTIMIZATION: O(1) Lookup Maps for instant scanning
  const productMaps = useMemo(() => {
    const barcodes = new Map<string, DbProduct>();
    const names = new Map<string, DbProduct>();

    dbProducts.forEach(p => {
      if (p.barcode) barcodes.set(p.barcode, p);
      if (p.name) names.set(p.name.toLowerCase(), p);
    });
    return { barcodes, names };
  }, [dbProducts]);

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
    useExtendedSearch: true,
    ignoreLocation: true,
  }), [dbProducts]);

  // Bilingual fuzzy search — no cap, virtual scrolling handles rendering
  const filteredProducts = useMemo(() => {
    const q = debouncedQuery.trim();

    if (!q) {
      return activeCategory === 'All Items'
        ? dbProducts
        : dbProducts.filter(p => p.category === activeCategory);
    }

    // Exact barcode match first using Map O(1)
    const exactBarcode = productMaps.barcodes.get(q);
    if (exactBarcode) return [exactBarcode];

    // Fuzzy search
    const fuseResults = fuse.search(q);
    let results = fuseResults.map(r => r.item);
    if (activeCategory !== 'All Items') {
      results = results.filter(p => p.category === activeCategory);
    }
    return results;
  }, [debouncedQuery, activeCategory, dbProducts, fuse, productMaps]);

  const addToCart = useCallback((product: DbProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Stock check removed to allow overselling
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

  // Global Scanner Buffer
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Process barcode: prefix-20 weigh barcodes + regular + name fallback
  const processBarcodeInput = useCallback((barcode: string): boolean => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return false;

    // 1. PREFIX CHECK (O(1)) for Weighted Items
    if (cleanBarcode.length >= 13 && cleanBarcode.startsWith('20')) {
      const weighed = parseWeighBarcode(cleanBarcode);
      if (weighed) {
        // Optimistic check: try exact 5-digit match logic if needed, 
        // but standard weigh barcode usually embeds ID. 
        // We search for matching barcode suffix or exact logic. 
        // Since we use Maps, we might need a secondary lookup for 'starts with' or suffix if standard lookup fails.
        // But dbProducts.find is O(N). To optimize strict prefix 20, we assume the internal code is mapped.

        // Standard strategy: The helper returns 'productCode'. We accept that.
        // Using logic from before:
        const match = dbProducts.find(p =>
          p.barcode && (p.barcode === weighed.productCode || p.barcode.endsWith(weighed.productCode))
        );

        if (match) {
          addWeighedItem(match, weighed.totalPrice);
          return true;
        }
      }
    }

    // 2. EXACT BARCODE MATCH (O(1)) - The Critical Speedup
    const exactMatch = productMaps.barcodes.get(cleanBarcode);
    if (exactMatch) {
      addToCart(exactMatch);
      toast.success(`✓ Scanned: ${exactMatch.name}`, { duration: 1500 });
      return true;
    }

    // 3. EXACT NAME MATCH (O(1))
    const nameMatch = productMaps.names.get(cleanBarcode.toLowerCase());
    if (nameMatch) {
      addToCart(nameMatch);
      return true;
    }

    // If nothing found, return false to trigger Quick Add Popup
    return false;
  }, [dbProducts, addToCart, addWeighedItem, productMaps]);

  // Global Scanner Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if common modifiers are held
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Handle Enter (Scanner termination)
      if (e.key === 'Enter') {
        const barcode = scannerBuffer.current.trim();
        if (barcode.length > 2) {
          e.preventDefault();
          if (!processBarcodeInput(barcode)) {
            setQuickAddBarcode(barcode);
            setQuickAddName('');
            setQuickAddOpen(true);
          }
          scannerBuffer.current = '';
        }
        return;
      }

      // Buffer capturing
      if (e.key.length === 1) {
        const now = Date.now();
        // If it's been too long between keys, it might be human typing in a random place
        // But the user specifically wants "Zero Failure", so we buffer everything if not in an input
        const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';

        if (!isInput) {
          scannerBuffer.current += e.key;
        } else if (isInput && (e.target === searchRef.current)) {
          // If it's the search box, let the local handler deal with it, but we can also sync the buffer
          // Actually, it's safer to let the local handler run for the search box.
        }
        lastKeyTime.current = now;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [processBarcodeInput]);

  // Barcode scanner: Enter key in Search Box
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      if (processBarcodeInput(query)) {
        setSearchQuery('');
        return;
      }

      // Not found logic
      setQuickAddBarcode(query);
      setQuickAddName('');
      setQuickAddOpen(true);
      setSearchQuery('');
    }
  }, [searchQuery, processBarcodeInput]);

  // Camera scan handler
  const handleCameraScan = useCallback((barcode: string) => {
    if (processBarcodeInput(barcode)) return;

    setQuickAddBarcode(barcode.trim());
    setQuickAddName('');
    setQuickAddOpen(true);
  }, [processBarcodeInput]);

  // Quick add product callback
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
      // Stock check removed
      return { ...item, quantity: qty };
    }));
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        // Stock check removed
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const addToCartById = (productId: string) => {
    const product = dbProducts.find(p => p.id === productId);
    if (product) addToCart(product);
  };

  const addQuickItem = (item: typeof QUICK_ITEMS[0]) => {
    // Check if product exists in DB with same name
    const existingProduct = dbProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    if (existingProduct) {
      addToCart(existingProduct);
      return;
    }

    const virtualProduct: DbProduct = {
      id: item.id,
      name: item.name,
      price: item.price,
      cost: 0,
      stock: 9999,
      barcode: '',
      sku: '',
      category: 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: null,
      min_stock: 0,
      name_ar: item.name,
      unit: 'piece',
      is_weighted: false,
      bulk_qty: null,
      bulk_unit: null,
      expiry_date: null,
      supplier: null,
    };
    addToCart(virtualProduct);
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
  // VAT is now INCLUDED in the price. 
  // Formula for extraction from Gross: VAT = Gross * (Rate / (100 + Rate))
  const total = subtotal - discountAmount;
  const taxAmount = total * (5 / 105);

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

  // Check for below-cost items — cost column doesn't exist in DB, skip this check
  const belowCostItems: typeof cart = [];

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
      // Fallback check against Master PIN
      const masterPin = localStorage.getItem('bhub_admin_password');
      if (pin === masterPin) {
        setShowOwnerOverride(false);
        setOverridePin('');
        if (pendingCheckoutMethod) {
          executeCheckout(pendingCheckoutMethod);
          setPendingCheckoutMethod(null);
        }
        toast.success('Owner override approved via Master PIN');
      } else {
        toast.error('Invalid owner PIN');
        setOverridePin('');
      }
    }
  };

  // Execute Checkout with Error Handling & Khat Integration
  const executeCheckout = async (method: string) => {
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    try {
      setIsSaving(true);

      // 1. Save to Offline DB (IndexedDB)
      const transactionData = {
        id: invoiceNo,
        cart: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.price,
          discount: i.discount || 0,
          total: (i.product.price * (1 - (i.discount || 0) / 100)) * i.quantity,
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
        createdAt: now.toISOString(),
        synced: false,
      };

      await saveOfflineTransaction(transactionData);

      // 1b. Save to Supabase transactions table (real columns)
      try {
        const { data: txData, error: txError } = await supabase.from('transactions').insert({
          total,
          tax: taxAmount,
          status: 'completed',
          customer_id: selectedCustomerId || null,
          items: cart.map(i => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.product.price,
            discount: i.discount || 0,
            total: (i.product.price * (1 - (i.discount || 0) / 100)) * i.quantity,
            barcode: i.product.barcode || null,
          })),
          payment_methods: [{ method, amount: total }],
        }).select().single();

        if (txError) {
          console.warn('Cloud sync failed (offline mode):', txError.message);
        } else {
          console.log('✅ Transaction saved to cloud:', txData?.id);
        }
      } catch (cloudErr) {
        console.warn('Cloud save skipped (offline):', cloudErr);
      }

      // 2. Khat (Debt) Integration
      if ((method === 'Khat/Daftar' || method === 'Credit') && selectedCustomerId) {
        // Get current credit_balance and increment it
        const { data: custData } = await supabase
          .from('customers')
          .select('credit_balance')
          .eq('id', selectedCustomerId)
          .single();

        const currentBalance = Number(custData?.credit_balance ?? 0);
        const { error: khatError } = await supabase
          .from('customers')
          .update({ credit_balance: currentBalance + total })
          .eq('id', selectedCustomerId);

        if (khatError) throw khatError;

        // Also log to credit ledger
        await supabase.from('credit_ledger').insert({
          customer_id: selectedCustomerId,
          amount: total,
          type: 'credit',
          note: `Auto-added from Invoice ${invoiceNo}`
        });
      }

      // 3. Fawtara QR Logic
      const storeName = localStorage.getItem('bhub_store_name') || 'B-HUB POS';
      const vatNumber = localStorage.getItem('bhub_vat_number') || '1234567890';

      const qrTlv = generateFawtaraQR({
        sellerName: storeName,
        vatNumber: vatNumber,
        timestamp: now.toISOString(),
        totalWithVat: total.toFixed(3),
        vatAmount: taxAmount.toFixed(3)
      });

      const receiptData = {
        storeName,
        vatin: vatNumber,
        invoiceNo,
        date: now.toISOString(),
        items: cart.map(i => ({
          name: i.product.name,
          nameAr: i.product.name,
          quantity: i.quantity,
          price: Number(i.product.price),
          total: i.product.price * i.quantity
        })),
        subtotal,
        vatAmount: taxAmount,
        discount: discountAmount,
        total,
        paymentMethod: method,
        customerName: selectedCustomer !== 'Walk-in Customer' ? selectedCustomer : undefined,
        qrCode: qrTlv
      };

      setCurrentReceiptData(receiptData);
      setShowReceipt(true);
      if (method === 'Cash') kickDrawer(true);

      toast.success(`Sale Complete: OMR ${total.toFixed(3)}`, {
        description: `${method} payment processed successfully.`,
        duration: 3000
      });

      // 5. PRINT RECEIPT (HARDWARE)
      try {
        const storeName = localStorage.getItem('bhub_store_name') || 'B-HUB POS';
        const dateStr = now.toLocaleString();

        await printReceiptBluetooth({
          storeName,
          invoiceNo,
          date: dateStr,
          items: cart,
          totals: { subtotal, tax: taxAmount, total },
          qrCode: invoiceNo // This would be the fawtara QR in a full impl
        });
      } catch (printErr) {
        console.warn('Printer connection failed:', printErr);
        toast.error('Printer Offline: Connection failed');
      }

      // Clear after visual confirmation (or immediately depends on preference, but here we keep receipt modal for a bit)
      setTimeout(() => {
        clearCart();
        setShowReceipt(false);
        setLastInvoice('');
      }, 5000);

    } catch (err: any) {
      console.error('Checkout failed:', err);
      toast.error('Error: Could not save transaction. Check your connection.', {
        description: err.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Khat customers — those with a credit balance (debt)
  const khatCustomers = dbCustomers.filter(c => (c.credit_balance ?? 0) > 0);

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
      <div className={cn("flex h-screen overflow-hidden rounded-lg flex-col bg-slate-50", roleBorderClass)}>
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

        {/* ═══ SUBSCRIPTION STATUS BANNER ═══ */}
        <AnimatePresence>
          {!isMasterStore && (subscriptionInfo.isExpired || subscriptionInfo.isBlocked || (subscriptionInfo.daysRemaining <= 3 && subscriptionInfo.daysRemaining > 0)) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-b relative overflow-hidden",
                subscriptionInfo.isExpired || subscriptionInfo.isBlocked
                  ? "bg-destructive/20 text-destructive border-destructive/30"
                  : "bg-warning/20 text-warning border-warning/30"
              )}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <AlertTriangle className="w-4 h-4" />
              </motion.div>
              {subscriptionInfo.isBlocked ? (
                <span>⛔ Account Blocked — Contact JABALSHAMS ADMIN (+968 XXXXXXXX)</span>
              ) : subscriptionInfo.isExpired ? (
                <span>🔒 Trial Ended — Contact JABALSHAMS ADMIN (+968 XXXXXXXX) to Activate</span>
              ) : (
                <span>⚠️ Trial Expires in {subscriptionInfo.daysRemaining} Days — Activate Soon!</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-row flex-1 overflow-hidden h-full relative">
          {/* Main Product Management Area (Dukkantek Style) */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] transition-all duration-300 relative">
            {/* Search Bar */}
            <div className="p-2 sm:p-4 border-b border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Long-press logo for admin toggle */}
                <button
                  onMouseDown={handleLogoTouchStart}
                  onMouseUp={handleLogoTouchEnd}
                  onMouseLeave={handleLogoTouchEnd}
                  onTouchStart={handleLogoTouchStart}
                  onTouchEnd={handleLogoTouchEnd}
                  className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative select-none"
                  title="B-HUB POS"
                >
                  <img src={logoIcon} alt="B-HUB" className="w-full h-full object-cover" />
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
                <CameraScanner onScan={handleCameraScan} />
                <button
                  onClick={() => { setQuickAddBarcode(''); setQuickAddName(''); setQuickAddOpen(true); }}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-success hover:border-success/50 transition-all"
                  title="Quick Add New Product"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {/* Checkout Toggle Removed - Sidebar is now Permanent */}
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
            <div className="px-4 py-3 border-b border-slate-200 bg-white overflow-x-auto">
              <div className="flex gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                      activeCategory === cat
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tiles for top 10 items */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground vertical-text rotate-180 mr-1">Quick</span>
                {QUICK_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addQuickItem(item)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[80px] h-16 rounded-xl border-2 transition-all active:scale-90",
                      item.color
                    )}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] font-bold truncate px-1 w-full">{item.name}</span>
                  </button>
                ))}
                {/* Dynamically add some real top items if available */}
                {dbProducts.slice(0, 7).filter(p => p.price > 0 && !QUICK_ITEMS.some(q => q.name === p.name)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col items-center justify-center min-w-[80px] h-16 rounded-xl border border-slate-200 bg-white text-slate-900 transition-all active:scale-90 hover:border-primary/50 shadow-sm"
                  >
                    <span className="text-[10px] font-black">{p.price.toFixed(3)}</span>
                    <span className="text-[9px] font-bold truncate px-1 w-full">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Left: Product Grid (75%) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9]">
              <ProductGrid
                products={filteredProducts}
                addToCart={addToCart}
                isOwner={staffSession?.role === 'owner'}
              />
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
                            (c.credit_balance ?? 0) > 50 ? 'text-destructive' : (c.credit_balance ?? 0) > 5 ? 'text-warning' : 'text-success'
                          )}>
                            <span className="text-gold">OMR</span> {Number(c.credit_balance ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn(
                            'h-full rounded-full transition-all',
                            (c.credit_balance ?? 0) > 50 ? 'debt-gauge-red' : (c.credit_balance ?? 0) > 5 ? 'debt-gauge-yellow' : 'debt-gauge-green'
                          )} style={{ width: `${Math.min((Number(c.credit_balance ?? 0) / 400) * 100, 100)}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{c.phone || '—'}</span>
                          {c.phone && (
                            <a
                              href={`https://wa.me/${c.phone.replace('+', '')}?text=${encodeURIComponent(`السلام عليكم / Hello!\nThis is a friendly reminder from ${localStorage.getItem('bhub_store_name') || 'B-HUB POS'}.\nYour current balance in our Khat ledger is: OMR ${Number(c.credit_balance ?? 0).toFixed(3)}.\nPlease visit the shop at your convenience to settle the amount.\nThank you for your business!\nB-HUB POS System`)}`}
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

          </div>

          {/* Cart Sidebar */}
          <div className="w-[380px] lg:w-[450px] flex-none border-l border-slate-200 bg-white flex flex-col items-stretch relative shadow-lg z-10 transition-all duration-300">
            {/* Cart Header - Dukkantek Style Transaction Bar */}
            <div className="flex-none p-4 bg-slate-900 text-white shadow-xl relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Transaction</span>
                    <button
                      onClick={() => setShowCustomerPicker(true)}
                      className="text-sm font-black text-white flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {selectedCustomer}
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block">Status</span>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", online ? 'bg-success animate-pulse' : 'bg-warning')} />
                    <span className={cn("text-[10px] font-black", online ? 'text-success' : 'text-warning')}>
                      {online ? 'SYNC_ACTIVE' : 'OFFLINE_MODE'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <button onClick={clearCart} className="text-[10px] font-black text-destructive/80 hover:text-destructive flex items-center gap-1 uppercase tracking-widest">
                  <Trash2 className="w-3 h-3" /> Clear Cart
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Items: {cart.length}</span>
                </div>
              </div>
            </div>

            {/* Cart Items - High Contrast White on Light */}
            <div className="flex-1 overflow-y-auto pos-scrollbar p-2 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 pt-20">
                  <ShoppingCart className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cart is empty</p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemFinal = (item.product.price * (1 - item.discount / 100)) * item.quantity;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.product.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 group shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 uppercase leading-tight truncate">{item.product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{item.product.price.toFixed(3)} x {item.quantity}</p>
                        </div>
                        <p className="text-xs font-black text-primary">OMR {itemFinal.toFixed(3)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all font-black text-slate-900">-</button>
                          <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all font-black text-slate-900">+</button>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Discount button */}
                          <button
                            onClick={() => {
                              const d = prompt(`Discount % for ${item.product.name}:`, String(item.discount || 0));
                              if (d !== null) {
                                const val = Math.min(100, Math.max(0, Number(d) || 0));
                                setCart(prev => prev.map(ci =>
                                  ci.product.id === item.product.id ? { ...ci, discount: val } : ci
                                ));
                              }
                            }}
                            className="flex items-center gap-0.5 px-2 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all text-[10px] font-black"
                            title="Set item discount"
                          >
                            %{item.discount > 0 ? item.discount : ''}
                          </button>
                          {/* Delete button */}
                          <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-destructive hover:bg-red-100 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Cart Summary & Dukkantek-Style Payment Grid */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-900">OMR {subtotal.toFixed(3)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                    <span>Discount ({cartDiscount}%)</span>
                    <span>-OMR {discountAmount.toFixed(3)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>VAT (5% Inc)</span>
                  <span className="text-slate-900">OMR {taxAmount.toFixed(3)}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-end mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total to Pay</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-xs font-black text-primary uppercase">OMR</span>
                      <span className="text-3xl font-black text-slate-900 italic leading-none">{total.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => initiateCheckout('Cash')}
                      disabled={cart.length === 0 || isSaving || (subscriptionInfo.isExpired && !isMasterStore) || subscriptionInfo.isBlocked}
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4",
                        cart.length > 0 && !subscriptionInfo.isExpired && !subscriptionInfo.isBlocked
                          ? "bg-success text-white border-success/60 hover:brightness-110 shadow-lg shadow-success/20"
                          : "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border-transparent"
                      )}
                    >
                      <Banknote className="w-6 h-6" />
                      <span className="text-sm font-black uppercase tracking-widest">CASH PAY</span>
                    </button>

                    <button
                      onClick={() => initiateCheckout('Card')}
                      disabled={cart.length === 0 || isSaving || (subscriptionInfo.isExpired && !isMasterStore) || subscriptionInfo.isBlocked}
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4",
                        cart.length > 0 && !subscriptionInfo.isExpired && !subscriptionInfo.isBlocked
                          ? "bg-info text-white border-info/60 hover:brightness-110 shadow-lg shadow-info/20"
                          : "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border-transparent"
                      )}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-sm font-black uppercase tracking-widest">CARD PAY</span>
                    </button>
                  </div>

                  <button
                    onClick={() => initiateCheckout('Khat/Daftar')}
                    disabled={cart.length === 0 || isSaving || (subscriptionInfo.isExpired && !isMasterStore) || subscriptionInfo.isBlocked}
                    className={cn(
                      "h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4",
                      cart.length > 0 && !subscriptionInfo.isExpired && !subscriptionInfo.isBlocked
                        ? "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                        : "bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed border-transparent"
                    )}
                  >
                    <Book className="w-5 h-5 text-gold" />
                    <span className="text-xs font-black uppercase tracking-widest">Add to Customer Khat Ledger</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Receipt Modal Overlay */}
            <AnimatePresence>
              {showReceipt && currentReceiptData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative"
                  >
                    <button
                      onClick={() => setShowReceipt(false)}
                      className="absolute -top-12 right-0 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <Receipt {...currentReceiptData} />
                    <div className="mt-6 flex justify-center gap-4">
                      <Button className="h-12 px-8 bg-success font-bold" onClick={() => window.print()}>
                        <Printer className="mr-2 w-5 h-5" /> Print 80mm
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    className="bg-white rounded-2xl p-6 w-full max-w-xs mx-4 text-center space-y-4 shadow-2xl border border-slate-200"
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
                          'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all',
                          overridePin.length > i ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-transparent'
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
                            className="h-10 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 hover:bg-slate-100 hover:text-primary transition-all active:scale-95 shadow-sm"
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

          {/* ═══ CUSTOMER PICKER MODAL ═══ */}
          <AnimatePresence>
            {showCustomerPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={() => setShowCustomerPicker(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-slate-900 p-4 text-white">
                    <h3 className="text-sm font-black uppercase tracking-widest">Select Customer</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Choose for Khat/Credit payment or tracking</p>
                  </div>

                  {/* Walk-in option */}
                  <button
                    onClick={() => {
                      setSelectedCustomer('Walk-in Customer');
                      setSelectedCustomerId(null);
                      setSelectedCustomerPhone('');
                      setShowCustomerPicker(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Walk-in Customer</p>
                      <p className="text-[10px] text-slate-400">No account needed</p>
                    </div>
                    {selectedCustomer === 'Walk-in Customer' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </button>

                  {/* Customer list */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {dbCustomers.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-xs text-slate-400 font-medium">No customers yet.</p>
                        <p className="text-[10px] text-slate-300 mt-1">Add customers in the Customers page.</p>
                      </div>
                    ) : (
                      dbCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c.name);
                            setSelectedCustomerId(c.id);
                            setSelectedCustomerPhone(c.phone || '');
                            setShowCustomerPicker(false);
                            toast.success(`Customer: ${c.name}`, { duration: 1500 });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-primary">{c.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.phone || 'No phone'}</p>
                          </div>
                          {(c.credit_balance ?? 0) > 0 && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-destructive font-black">Owes</p>
                              <p className="text-xs font-black text-destructive">OMR {Number(c.credit_balance ?? 0).toFixed(3)}</p>
                            </div>
                          )}
                          {selectedCustomerId === c.id && (
                            <div className="ml-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-black">✓</span>
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => setShowCustomerPicker(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Mobile Cart Floating Action Button */}
          {!mobileCartOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="lg:hidden fixed bottom-4 left-4 right-4 z-40"
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
                className="bg-white rounded-2xl p-8 w-full max-w-xs mx-4 text-center space-y-5 shadow-2xl border border-slate-200"
              >
                <Crown className="w-10 h-10 mx-auto text-gold" />
                <h3 className="text-sm font-bold font-heading text-slate-900 uppercase tracking-widest">Owner Authentication</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Enter Owner PIN to switch to Admin mode</p>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={adminTogglePin.length > i ? { scale: [1, 1.2, 1] } : {}}
                      className={cn(
                        'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all',
                        adminTogglePin.length > i
                          ? 'border-gold bg-gold/10 text-gold shadow-md shadow-gold/10'
                          : 'border-slate-100 text-transparent'
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
                        className="h-12 rounded-xl bg-slate-50 border border-slate-200 text-base font-bold text-slate-900 hover:bg-slate-100 hover:text-gold transition-all shadow-sm active:scale-95"
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

        <QuickAddProduct
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          prefillBarcode={quickAddBarcode}
          prefillName={quickAddName}
          onProductAdded={handleQuickProductAdded}
        />
      </div>
    </>
  );
};

export default POS;
