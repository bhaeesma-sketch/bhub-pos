export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image?: string;
  unit: string;
  sku: string;
  minStock: number;
  supplier?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  balance: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'completed' | 'refunded' | 'pending';
  createdAt: string;
  cashier: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export const categories = [
  'All Items',
  'Beverages',
  'Snacks',
  'Dairy',
  'Bakery',
  'Household',
  'Personal Care',
  'Frozen',
  'Fruits & Vegetables',
  'Meat & Poultry',
  'Canned Goods',
];

export const products: Product[] = [
  { id: '1', name: 'Coca Cola 350ml', barcode: '5449000000996', price: 2.50, cost: 1.80, stock: 150, category: 'Beverages', unit: 'Piece', sku: 'BEV001', minStock: 20 },
  { id: '2', name: 'Pepsi 350ml', barcode: '5449000000997', price: 2.50, cost: 1.75, stock: 120, category: 'Beverages', unit: 'Piece', sku: 'BEV002', minStock: 20 },
  { id: '3', name: 'Lays Classic Chips', barcode: '5449000000998', price: 5.00, cost: 3.50, stock: 80, category: 'Snacks', unit: 'Piece', sku: 'SNK001', minStock: 15 },
  { id: '4', name: 'Al Marai Full Cream Milk 1L', barcode: '5449000000999', price: 7.50, cost: 5.50, stock: 60, category: 'Dairy', unit: 'Piece', sku: 'DRY001', minStock: 10 },
  { id: '5', name: 'Arabic Bread Pack', barcode: '5449000001000', price: 3.00, cost: 2.00, stock: 45, category: 'Bakery', unit: 'Pack', sku: 'BKR001', minStock: 10 },
  { id: '6', name: 'Tide Detergent 3kg', barcode: '5449000001001', price: 35.00, cost: 25.00, stock: 30, category: 'Household', unit: 'Piece', sku: 'HHS001', minStock: 5 },
  { id: '7', name: 'Dove Soap Bar', barcode: '5449000001002', price: 8.00, cost: 5.00, stock: 50, category: 'Personal Care', unit: 'Piece', sku: 'PRC001', minStock: 10 },
  { id: '8', name: 'Water Bottle 1.5L', barcode: '5449000001003', price: 1.50, cost: 0.80, stock: 200, category: 'Beverages', unit: 'Piece', sku: 'BEV003', minStock: 30 },
  { id: '9', name: 'KitKat Chocolate', barcode: '5449000001004', price: 3.50, cost: 2.20, stock: 90, category: 'Snacks', unit: 'Piece', sku: 'SNK002', minStock: 15 },
  { id: '10', name: 'Almarai Yogurt 170g', barcode: '5449000001005', price: 2.00, cost: 1.20, stock: 70, category: 'Dairy', unit: 'Piece', sku: 'DRY002', minStock: 15 },
  { id: '11', name: 'Frozen Chicken 1kg', barcode: '5449000001006', price: 22.00, cost: 16.00, stock: 25, category: 'Frozen', unit: 'kg', sku: 'FRZ001', minStock: 5 },
  { id: '12', name: 'Banana (per kg)', barcode: '5449000001007', price: 6.00, cost: 3.50, stock: 40, category: 'Fruits & Vegetables', unit: 'kg', sku: 'FRV001', minStock: 10 },
  { id: '13', name: 'Red Apple (per kg)', barcode: '5449000001008', price: 12.00, cost: 8.00, stock: 35, category: 'Fruits & Vegetables', unit: 'kg', sku: 'FRV002', minStock: 8 },
  { id: '14', name: 'Tomato Paste Can', barcode: '5449000001009', price: 4.50, cost: 2.80, stock: 55, category: 'Canned Goods', unit: 'Piece', sku: 'CAN001', minStock: 10 },
  { id: '15', name: 'Tuna Can', barcode: '5449000001010', price: 8.50, cost: 5.50, stock: 65, category: 'Canned Goods', unit: 'Piece', sku: 'CAN002', minStock: 10 },
  { id: '16', name: 'Fresh Orange Juice 1L', barcode: '5449000001011', price: 12.00, cost: 8.00, stock: 30, category: 'Beverages', unit: 'Piece', sku: 'BEV004', minStock: 8 },
  { id: '17', name: 'Oreo Cookies', barcode: '5449000001012', price: 6.50, cost: 4.00, stock: 45, category: 'Snacks', unit: 'Piece', sku: 'SNK003', minStock: 10 },
  { id: '18', name: 'Colgate Toothpaste', barcode: '5449000001013', price: 9.00, cost: 6.00, stock: 40, category: 'Personal Care', unit: 'Piece', sku: 'PRC002', minStock: 8 },
  { id: '19', name: 'Beef Mince 500g', barcode: '5449000001014', price: 28.00, cost: 20.00, stock: 15, category: 'Meat & Poultry', unit: 'Pack', sku: 'MTP001', minStock: 5 },
  { id: '20', name: 'Eggs Tray (30)', barcode: '5449000001015', price: 18.00, cost: 13.00, stock: 20, category: 'Dairy', unit: 'Tray', sku: 'DRY003', minStock: 5 },
];

export const customers: Customer[] = [
  { id: '1', name: 'Ahmed Al Rashid', phone: '+971501234567', email: 'ahmed@email.com', address: 'Dubai, UAE', totalPurchases: 2450.00, balance: 0, createdAt: '2024-01-15' },
  { id: '2', name: 'Mohammed Hassan', phone: '+971502345678', email: 'mohammed@email.com', address: 'Sharjah, UAE', totalPurchases: 1830.00, balance: 150.00, createdAt: '2024-02-20' },
  { id: '3', name: 'Fatima Al Zahra', phone: '+971503456789', email: 'fatima@email.com', address: 'Abu Dhabi, UAE', totalPurchases: 3200.00, balance: 0, createdAt: '2024-01-10' },
  { id: '4', name: 'Omar Khalid', phone: '+971504567890', totalPurchases: 950.00, balance: 75.00, createdAt: '2024-03-05' },
  { id: '5', name: 'Sara Ibrahim', phone: '+971505678901', email: 'sara@email.com', address: 'Ajman, UAE', totalPurchases: 1600.00, balance: 0, createdAt: '2024-02-01' },
  { id: '6', name: 'Yousef Al Ali', phone: '+971506789012', totalPurchases: 780.00, balance: 200.00, createdAt: '2024-03-15' },
];

export const sales: Sale[] = [
  {
    id: '1', invoiceNo: 'INV-0001', customerName: 'Ahmed Al Rashid', customerId: '1',
    items: [{ product: products[0], quantity: 3, discount: 0 }, { product: products[2], quantity: 2, discount: 0 }],
    subtotal: 17.50, discount: 0, tax: 0.88, total: 18.38, paymentMethod: 'Cash', status: 'completed', createdAt: '2024-12-01T10:30:00', cashier: 'Admin'
  },
  {
    id: '2', invoiceNo: 'INV-0002', customerName: 'Walk-in Customer',
    items: [{ product: products[3], quantity: 2, discount: 0 }, { product: products[4], quantity: 1, discount: 0 }],
    subtotal: 18.00, discount: 1.00, tax: 0.85, total: 17.85, paymentMethod: 'Card', status: 'completed', createdAt: '2024-12-01T11:15:00', cashier: 'Admin'
  },
  {
    id: '3', invoiceNo: 'INV-0003', customerName: 'Mohammed Hassan', customerId: '2',
    items: [{ product: products[5], quantity: 1, discount: 0 }],
    subtotal: 35.00, discount: 0, tax: 1.75, total: 36.75, paymentMethod: 'Cash', status: 'completed', createdAt: '2024-12-01T14:00:00', cashier: 'Admin'
  },
  {
    id: '4', invoiceNo: 'INV-0004', customerName: 'Fatima Al Zahra', customerId: '3',
    items: [{ product: products[10], quantity: 2, discount: 0 }, { product: products[11], quantity: 3, discount: 0 }],
    subtotal: 62.00, discount: 5.00, tax: 2.85, total: 59.85, paymentMethod: 'Card', status: 'completed', createdAt: '2024-12-02T09:45:00', cashier: 'Admin'
  },
  {
    id: '5', invoiceNo: 'INV-0005', customerName: 'Walk-in Customer',
    items: [{ product: products[8], quantity: 5, discount: 0 }],
    subtotal: 17.50, discount: 0, tax: 0.88, total: 18.38, paymentMethod: 'Cash', status: 'refunded', createdAt: '2024-12-02T12:30:00', cashier: 'Admin'
  },
];

export const dailySalesData = [
  { day: 'Sat', sales: 1250, orders: 45 },
  { day: 'Sun', sales: 1480, orders: 52 },
  { day: 'Mon', sales: 980, orders: 38 },
  { day: 'Tue', sales: 1320, orders: 47 },
  { day: 'Wed', sales: 1560, orders: 55 },
  { day: 'Thu', sales: 1890, orders: 63 },
  { day: 'Fri', sales: 2100, orders: 72 },
];

export const monthlySalesData = [
  { month: 'Jan', sales: 32500 },
  { month: 'Feb', sales: 28900 },
  { month: 'Mar', sales: 35200 },
  { month: 'Apr', sales: 31800 },
  { month: 'May', sales: 38500 },
  { month: 'Jun', sales: 42100 },
  { month: 'Jul', sales: 39800 },
  { month: 'Aug', sales: 44200 },
  { month: 'Sep', sales: 41500 },
  { month: 'Oct', sales: 46800 },
  { month: 'Nov', sales: 48200 },
  { month: 'Dec', sales: 52100 },
];

export const topSellingProducts = [
  { name: 'Coca Cola 350ml', sold: 320, revenue: 800 },
  { name: 'Water Bottle 1.5L', sold: 280, revenue: 420 },
  { name: 'Arabic Bread Pack', sold: 210, revenue: 630 },
  { name: 'Al Marai Milk 1L', sold: 180, revenue: 1350 },
  { name: 'Lays Classic Chips', sold: 160, revenue: 800 },
];
