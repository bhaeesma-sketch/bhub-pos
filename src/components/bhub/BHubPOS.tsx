import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Customer, Shift, User, Store } from '@/types/bhub';
import { BarcodeParser } from '@/lib/barcode-parser';
import { cloudSync } from '@/lib/bhub-cloud-sync';
import { offlineDb } from '@/lib/offlineDb';

interface BHubPOSProps {
    user: User;
    store: Store;
    shift: Shift;
}

export const BHubPOS: React.FC<BHubPOSProps> = ({ user, store, shift }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const barcodeBufferRef = useRef('');
    const lastKeypressRef = useRef<number>(0);

    // Fetch products from cloud on mount
    useEffect(() => {
        loadProductsFromCloud();
    }, [store.id]);

    const loadProductsFromCloud = async () => {
        try {
            const cloudProducts = await cloudSync.fetchProducts(store.id);
            if (cloudProducts.length > 0) {
                setProducts(cloudProducts);
                // Cache locally
                localStorage.setItem('bhub_products_cache', JSON.stringify(cloudProducts));
            } else {
                // Fallback to mock data if cloud fails
                loadMockProducts();
            }
        } catch (error) {
            console.error('Failed to load products from cloud, using mock data:', error);
            loadMockProducts();
        }
    };

    const loadMockProducts = () => {
        const mockProducts: Product[] = [
            { id: '1', sku: 'BRD001', barcode: '6001234567890', name: 'White Bread', nameAr: 'خبز أبيض', category: 'fast-moving', price: 0.450, cost: 0.300, stock: 50, unit: 'piece', isWeightBased: false, isFastMoving: true, vatRate: 0.05 },
            { id: '2', sku: 'MLK001', barcode: '6001234567891', name: 'Fresh Milk 1L', nameAr: 'حليب طازج', category: 'fast-moving', price: 0.600, cost: 0.400, stock: 30, unit: 'piece', isWeightBased: false, isFastMoving: true, vatRate: 0.05 },
            { id: '3', sku: 'WTR001', barcode: '6001234567892', name: 'Water 1.5L', nameAr: 'ماء', category: 'fast-moving', price: 0.150, cost: 0.080, stock: 100, unit: 'piece', isWeightBased: false, isFastMoving: true, vatRate: 0.05 },
            { id: '4', sku: 'EGG001', barcode: '6001234567893', name: 'Eggs (30pcs)', nameAr: 'بيض', category: 'fast-moving', price: 1.200, cost: 0.900, stock: 40, unit: 'pack', isWeightBased: false, isFastMoving: true, vatRate: 0.05 },
            { id: '5', sku: 'TOM001', barcode: '00001', name: 'Tomatoes', nameAr: 'طماطم', category: 'vegetables', price: 0.800, cost: 0.500, stock: 25, unit: 'kg', isWeightBased: true, isFastMoving: false, vatRate: 0.05 },
            { id: '6', sku: 'ONI001', barcode: '00002', name: 'Onions', nameAr: 'بصل', category: 'vegetables', price: 0.600, cost: 0.350, stock: 30, unit: 'kg', isWeightBased: true, isFastMoving: false, vatRate: 0.05 },
        ];
        setProducts(mockProducts);
    };

    // Barcode scanner listener
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // If more than 100ms since last keypress, reset buffer (manual typing)
            if (currentTime - lastKeypressRef.current > 100) {
                barcodeBufferRef.current = '';
            }

            lastKeypressRef.current = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBufferRef.current) {
                    handleBarcodeScanned(barcodeBufferRef.current);
                    barcodeBufferRef.current = '';
                }
            } else if (e.key.length === 1) {
                barcodeBufferRef.current += e.key;
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [products, cart]);

    const handleBarcodeScanned = (barcode: string) => {
        const parsed = BarcodeParser.parse(barcode);

        if (parsed.type === 'gs1-weight') {
            // Weight-based item
            const product = products.find(p => p.barcode === parsed.productCode);
            if (product) {
                const quantity = parsed.weight || (parsed.price! / product.price);
                addToCart(product, quantity);
            }
        } else {
            // Standard barcode
            const product = products.find(p => p.barcode === parsed.productCode);
            if (product) {
                addToCart(product, 1);
            }
        }
    };

    const addToCart = (product: Product, quantity: number = 1) => {
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.product.id === product.id);

            if (existingIndex >= 0) {
                // Increment quantity
                const updated = [...prevCart];
                const newQuantity = updated[existingIndex].quantity + quantity;
                const lineTotal = newQuantity * product.price;
                const vatAmount = lineTotal * product.vatRate;

                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: newQuantity,
                    lineTotal,
                    vatAmount,
                };
                return updated;
            } else {
                // Add new item
                const lineTotal = quantity * product.price;
                const vatAmount = lineTotal * product.vatRate;

                return [...prevCart, {
                    product,
                    quantity,
                    unitPrice: product.price,
                    selectedUnit: product.unit,
                    lineTotal,
                    vatAmount,
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(cart.map(item => {
            if (item.product.id === productId) {
                const lineTotal = newQuantity * item.unitPrice;
                const vatAmount = lineTotal * item.product.vatRate;
                return { ...item, quantity: newQuantity, lineTotal, vatAmount };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        setCustomer(null);
        setCustomerPhone('');
    };

    const lookupCustomer = () => {
        // Mock customer lookup
        if (customerPhone.length >= 8) {
            setCustomer({
                id: '1',
                phone: customerPhone,
                name: 'Ahmed Al-Balushi',
                loyaltyPoints: 450,
                discountTier: 5,
            });
        }
    };

    const calculateTotals = () => {
        const subtotalExVAT = cart.reduce((sum, item) => sum + (item.lineTotal / (1 + item.product.vatRate)), 0);
        const vatAmount = cart.reduce((sum, item) => sum + item.vatAmount, 0);
        const subtotalIncVAT = cart.reduce((sum, item) => sum + item.lineTotal, 0);
        const discount = customer ? (subtotalIncVAT * customer.discountTier / 100) : 0;
        const total = subtotalIncVAT - discount;

        return { subtotalExVAT, vatAmount, subtotalIncVAT, discount, total };
    };

    const totals = calculateTotals();

    const fastMovingProducts = products.filter(p => p.isFastMoving);
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cashReceived, setCashReceived] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'khat'>('cash');

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 800));

            if (paymentType === 'khat') {
                if (!customer) {
                    setIsProcessing(false);
                    alert('⚠️ Customer Required for Credit (Khat) Sale!\nPlease select a customer first.');
                    return;
                }
                // Add to local ledger
                await offlineDb.addCredit(customer, totals.total, `SALE-${Date.now()}`);
            }

            const saleData = {
                id: `SALE-${Date.now()}`,
                storeId: store.id,
                shiftId: shift.id,
                userId: user.id,
                customerId: customer?.id,
                items: cart,
                subtotal: totals.subtotalExVAT,
                vatAmount: totals.vatAmount,
                discount: totals.discount,
                total: totals.total,
                paymentMethod: paymentType,
                amountPaid: paymentType === 'cash' ? (parseFloat(cashReceived) || totals.total) : totals.total,
                change: paymentType === 'cash' ? ((parseFloat(cashReceived) || totals.total) - totals.total) : 0,
                timestamp: new Date(),
                receiptNumber: `RCP-${Date.now()}`,
            };

            // ✅ PUSH TO CLOUD FOR OWNER REMOTE MONITORING
            await cloudSync.pushSale(saleData);
            console.log('✅ Sale synced to cloud for owner dashboard:', saleData.id);

            // Print receipt
            printReceipt(saleData);

            // Clear cart and close modal
            clearCart();
            setShowPaymentModal(false);
            setCashReceived('');

            // Show success message
            alert(`✅ Payment Successful!\n\nTotal: OMR ${totals.total.toFixed(3)}\nCash: OMR ${saleData.amountPaid.toFixed(3)}\nChange: OMR ${saleData.change.toFixed(3)}\n\nReceipt: ${saleData.receiptNumber}`);

        } catch (error) {
            alert('❌ Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const printReceipt = (sale: any) => {
        // Generate receipt text
        const receipt = `
========================================
        ${store.name}
        ${store.location}
        TRN: ${store.taxNumber}
========================================
Receipt: ${sale.receiptNumber}
Date: ${new Date().toLocaleString('en-GB')}
Cashier: ${user.fullName}
${customer ? `Customer: ${customer.name} (${customer.phone})` : ''}
========================================
ITEMS:
${cart.map(item => `${item.product.name}
  ${item.quantity.toFixed(item.product.isWeightBased ? 3 : 0)} x ${item.unitPrice.toFixed(3)} = ${item.lineTotal.toFixed(3)}`).join('\n')}
========================================
Subtotal (Ex VAT):    ${totals.subtotalExVAT.toFixed(3)}
VAT (5%):             ${totals.vatAmount.toFixed(3)}
Subtotal (Inc VAT):   ${totals.subtotalIncVAT.toFixed(3)}
${customer && totals.discount > 0 ? `Discount (${customer.discountTier}%):      -${totals.discount.toFixed(3)}` : ''}
----------------------------------------
TOTAL:                ${totals.total.toFixed(3)} OMR
Cash:                 ${sale.amountPaid.toFixed(3)} OMR
Change:               ${sale.change.toFixed(3)} OMR
========================================
        Thank you for your business!
        شكرا لك على عملك
========================================
        `;

        console.log(receipt);
        // TODO: Send to actual printer
    };

    const handleQuickPay = (amount: number) => {
        setCashReceived(amount.toString());
    };

    return (
        <div className="h-screen bg-[#121212] flex flex-col">
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-md w-full border border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Complete Payment</h2>

                        <div className="bg-[#2A2A2A] rounded-lg p-4 mb-6">
                            <div className="flex justify-between text-gray-400 mb-2">
                                <span>Total Amount:</span>
                                <span className="text-[#D4AF37] font-bold text-2xl">OMR {totals.total.toFixed(3)}</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2 font-medium">Cash Received (OMR)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                className="w-full px-4 py-4 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                placeholder="0.000"
                                autoFocus
                            />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {[5, 10, 20, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleQuickPay(amount)}
                                    className="py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-700 rounded-lg text-white font-bold transition"
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>

                        {/* Exact Amount Button */}
                        <button
                            onClick={() => setCashReceived(totals.total.toFixed(3))}
                            className="w-full py-3 bg-[#D4AF37] hover:bg-[#FFD700] text-[#121212] font-bold rounded-lg mb-4 transition"
                        >
                            Exact Amount
                        </button>

                        {/* Change Display */}
                        {cashReceived && parseFloat(cashReceived) >= totals.total && (
                            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-green-400 font-medium">Change:</span>
                                    <span className="text-green-400 font-bold text-xl">
                                        OMR {(parseFloat(cashReceived) - totals.total).toFixed(3)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setCashReceived('');
                                }}
                                disabled={isProcessing}
                                className="py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !cashReceived || parseFloat(cashReceived) < totals.total}
                                className="py-4 bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#20c997] hover:to-[#28a745] text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {isProcessing ? 'Processing...' : 'CONFIRM PAYMENT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Top Bar */}
            <div className="bg-[#1E1E1E] border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
                            <span className="text-[#121212] font-bold text-lg">B</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-sm">{store.name}</h1>
                            <p className="text-gray-400 text-xs">{user.fullName}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                    <div className="text-right">
                        <p className="text-gray-400">Shift Started</p>
                        <p className="text-white font-medium">{new Date(shift.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                        End Shift
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Product Grid (60%) */}
                <div className="w-[60%] flex flex-col border-r border-gray-800">
                    {/* Search and Categories */}
                    <div className="p-4 bg-[#1E1E1E] border-b border-gray-800">
                        <input
                            type="text"
                            placeholder="Search products or scan barcode... / ابحث عن المنتجات"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] mb-3"
                        />

                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {['all', 'fast-moving', 'vegetables', 'dairy', 'beverages'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${selectedCategory === cat
                                        ? 'bg-[#D4AF37] text-[#121212]'
                                        : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
                                        }`}
                                >
                                    {cat === 'all' ? 'All' : cat === 'fast-moving' ? '⚡ Fast Moving' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-4 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-4 hover:border-[#D4AF37] hover:bg-[#2A2A2A] transition group"
                                >
                                    <div className="aspect-square bg-[#2A2A2A] rounded-lg mb-3 flex items-center justify-center group-hover:bg-[#3A3A3A] transition">
                                        <span className="text-4xl">{product.category === 'vegetables' ? '🥬' : '📦'}</span>
                                    </div>
                                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                                    <p className="text-gray-400 text-xs mb-2">{product.nameAr}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#D4AF37] font-bold text-lg">
                                            {product.price.toFixed(3)}
                                        </span>
                                        <span className="text-gray-500 text-xs">/{product.unit}</span>
                                    </div>
                                    {product.stock < 10 && (
                                        <div className="mt-2 text-xs text-orange-400">⚠️ Low Stock</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Cart (40%) */}
                <div className="w-[40%] flex flex-col bg-[#1E1E1E]">
                    {/* Customer Lookup */}
                    <div className="p-4 bg-[#2A2A2A] border-b border-gray-800">
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                placeholder="Customer Phone / رقم الهاتف"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && lookupCustomer()}
                                className="flex-1 px-3 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                            />
                            <button
                                onClick={lookupCustomer}
                                className="px-4 py-2 bg-[#D4AF37] text-[#121212] rounded-lg font-medium hover:bg-[#FFD700] transition"
                            >
                                Lookup
                            </button>
                        </div>
                        {customer && (
                            <div className="mt-2 p-2 bg-green-900/20 border border-green-500 rounded-lg text-sm">
                                <p className="text-green-400 font-medium">✓ {customer.name}</p>
                                <p className="text-green-300 text-xs">{customer.discountTier}% Loyalty Discount • {customer.loyaltyPoints} pts</p>
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-lg font-medium">Cart is Empty</p>
                                <p className="text-sm">عربة التسوق فارغة</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.product.id} className="bg-[#2A2A2A] rounded-lg p-3 border border-gray-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium text-sm">{item.product.name}</h4>
                                                <p className="text-gray-400 text-xs">{item.product.nameAr}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="text-red-400 hover:text-red-300 ml-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    className="w-8 h-8 bg-[#1E1E1E] rounded-lg flex items-center justify-center text-white hover:bg-[#3A3A3A] transition"
                                                >
                                                    −
                                                </button>
                                                <span className="text-white font-bold w-12 text-center">
                                                    {item.quantity.toFixed(item.product.isWeightBased ? 3 : 0)}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    className="w-8 h-8 bg-[#1E1E1E] rounded-lg flex items-center justify-center text-white hover:bg-[#3A3A3A] transition"
                                                >
                                                    +
                                                </button>
                                                <span className="text-gray-400 text-xs">× {item.unitPrice.toFixed(3)}</span>
                                            </div>
                                            <span className="text-[#D4AF37] font-bold text-lg">
                                                {item.lineTotal.toFixed(3)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Totals and Checkout */}
                    {cart.length > 0 && (
                        <div className="border-t border-gray-800 p-4 bg-[#2A2A2A]">
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal (Ex VAT)</span>
                                    <span>OMR {totals.subtotalExVAT.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>VAT (5%)</span>
                                    <span>OMR {totals.vatAmount.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between text-white font-medium">
                                    <span>Subtotal (Inc VAT)</span>
                                    <span>OMR {totals.subtotalIncVAT.toFixed(3)}</span>
                                </div>
                                {customer && totals.discount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Loyalty Discount ({customer.discountTier}%)</span>
                                        <span>- OMR {totals.discount.toFixed(3)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[#D4AF37] font-bold text-2xl pt-2 border-t border-gray-700">
                                    <span>TOTAL</span>
                                    <span>OMR {totals.total.toFixed(3)}</span>
                                </div>
                            </div>

                            {/* Quick Pay Buttons */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {[5, 10, 20, 50].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => {
                                            setCashReceived(amount.toString());
                                            setShowPaymentModal(true);
                                        }}
                                        className="py-3 min-h-[48px] bg-[#1E1E1E] hover:bg-[#3A3A3A] border border-gray-700 rounded-lg text-white text-sm font-medium transition"
                                    >
                                        {amount}
                                    </button>
                                ))}
                            </div>

                            {/* Main Action Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={clearCart}
                                    className="py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                                >
                                    CLEAR
                                </button>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="py-4 bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#20c997] hover:to-[#28a745] text-white font-bold rounded-lg transition shadow-lg"
                                >
                                    PAY / ادفع
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1E1E1E] w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Complete Payment / إتمام الدفع</h2>
                                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="text-center mb-8">
                                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Amount</p>
                                    <p className="text-5xl font-bold text-[#D4AF37]">
                                        {totals.total.toFixed(3)} <span className="text-2xl text-gray-500">OMR</span>
                                    </p>
                                </div>

                                {/* Payment Method Selection */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <button
                                        onClick={() => setPaymentType('cash')}
                                        className={`py-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center gap-2 transition ${paymentType === 'cash' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-gray-700 bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A]'
                                            }`}
                                    >
                                        <span>💵 Cash</span>
                                        <span className="text-xs font-normal">نقدي</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentType('card')}
                                        className={`py-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center gap-2 transition ${paymentType === 'card' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gray-700 bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A]'
                                            }`}
                                    >
                                        <span>💳 Card</span>
                                        <span className="text-xs font-normal">بطاقة بنكية</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentType('khat')}
                                        className={`py-4 rounded-xl border-2 font-bold text-lg flex flex-col items-center gap-2 transition ${paymentType === 'khat' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-[#2A2A2A] text-gray-400 hover:bg-[#3A3A3A]'
                                            }`}
                                    >
                                        <span>📝 Khat</span>
                                        <span className="text-xs font-normal">آجل (دفتر)</span>
                                    </button>
                                </div>

                                {/* Dynamic Content Based on Method */}
                                {paymentType === 'cash' && (
                                    <div className="space-y-4">
                                        <div className="bg-[#121212] p-4 rounded-xl border border-gray-700">
                                            <label className="block text-sm text-gray-400 mb-2">Cash Received</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    className="w-full bg-transparent text-3xl font-bold text-white focus:outline-none"
                                                    placeholder="0.000"
                                                    autoFocus
                                                />
                                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500">OMR</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-[#2A2A2A] p-4 rounded-xl">
                                            <span className="text-gray-400">Change / الباقي</span>
                                            <span className={`text-2xl font-bold ${(parseFloat(cashReceived) || 0) - totals.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {((parseFloat(cashReceived) || 0) - totals.total).toFixed(3)} OMR
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {[5, 10, 20, 50].map(amount => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setCashReceived(amount.toString())}
                                                    className="py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white hover:bg-[#3A3A3A]"
                                                >
                                                    {amount}.000
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {paymentType === 'khat' && (
                                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37] p-6 rounded-xl text-center">
                                        {customer ? (
                                            <>
                                                <p className="text-[#D4AF37] font-bold text-lg mb-2">Customer: {customer.name}</p>
                                                <p className="text-gray-400">Amount will be added to Khat ledger.</p>
                                            </>
                                        ) : (
                                            <p className="text-red-400 font-bold animate-pulse">
                                                ⚠️ Please select a customer first!
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-800 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || (paymentType === 'cash' && (parseFloat(cashReceived) || 0) < totals.total) || (paymentType === 'khat' && !customer)}
                                    className="py-4 bg-gradient-to-r from-[#28a745] to-[#20c997] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <span className="animate-spin">↻</span>
                                    ) : (
                                        <span>Confirm Payment ✓</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
