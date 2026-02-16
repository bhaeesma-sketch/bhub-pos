// B-HUB POS Type Definitions

export interface Store {
    id: string;
    name: string;
    location: string;
    taxNumber: string;
}

export interface User {
    id: string;
    username: string;
    storeId: string;
    role: 'cashier' | 'manager' | 'admin';
    fullName: string;
}

export interface Shift {
    id: string;
    storeId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    openingCash: number;
    closingCash?: number;
    status: 'active' | 'closed';
}

export interface Product {
    id: string;
    storeId?: string;
    sku: string;
    barcode: string;
    name: string;
    nameAr: string;
    category: string;
    price: number;
    cost: number;
    stock: number;
    unit: 'piece' | 'kg' | 'pack' | 'carton' | string;
    isWeightBased: boolean;
    isFastMoving: boolean;
    vatRate: number;
    imageUrl?: string;
    alternateUnits?: {
        unit: string;
        conversionFactor: number;
        price: number;
    }[];
}

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    selectedUnit: string;
    lineTotal: number;
    vatAmount: number;
}

export interface Customer {
    id: string;
    phone: string;
    name: string;
    loyaltyPoints: number;
    discountTier: number;
}

export interface Sale {
    id: string;
    storeId: string;
    shiftId: string;
    userId: string;
    customerId?: string;
    items: CartItem[];
    subtotal: number;
    vatAmount: number;
    discount: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'credit';
    amountPaid: number;
    change: number;
    timestamp: Date;
    receiptNumber: string;
    synced?: number; // 0 = no, 1 = yes
}

export interface BarcodeData {
    raw: string;
    type: 'standard' | 'gs1-weight';
    productCode?: string;
    weight?: number;
    price?: number;
}
