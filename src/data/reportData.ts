// ======= Digital Summary Report =======
export interface DigitalSummary {
  period: string;
  storeName: string;
  currency: string;
  totalTransactions: number;
  nonWeightedQty: number;
  weightedQty: number;
  weightedUnit: string;
  salesDetails: { label: string; amount: number }[];
  outstanding: { label: string; amount: number }[];
  customerRefund: number;
  netCash: number;
  grandTotalSales: number;
}

export const digitalSummary: DigitalSummary = {
  period: '09 Jul 2024 – 09 Aug 2024',
  storeName: 'JABAL SHAMS GROCERY',
  currency: 'OMR',
  totalTransactions: 6551,
  nonWeightedQty: 20147,
  weightedQty: 259.65,
  weightedUnit: 'Kilo',
  salesDetails: [
    { label: 'Cash', amount: 2984.78 },
    { label: 'Card', amount: 1651.13 },
    { label: 'Online Aggregator (Talabat, InstaShop)', amount: 0.00 },
    { label: 'Customer Credit', amount: 218.39 },
  ],
  outstanding: [
    { label: 'Customer credit paid back by card', amount: 28.97 },
    { label: 'Customer credit paid back by cash', amount: 33.19 },
    { label: 'Net customer credit', amount: 844.16 },
  ],
  customerRefund: 485.86,
  netCash: 3017.97,
  grandTotalSales: 4698.07,
};

// ======= Customer Credit Report =======
export interface CreditCustomer {
  id: number;
  name: string;
  phone: string;
  totalDebt: number;
  totalSpent: number;
}

export const creditCustomersPeriod: CreditCustomer[] = [
  { id: 1, name: 'adnan', phone: '+96898675132', totalDebt: 158.75, totalSpent: 0.00 },
  { id: 2, name: 'on company', phone: '+96823456789', totalDebt: 17.80, totalSpent: 0.00 },
  { id: 3, name: 'room', phone: '+96879732710', totalDebt: 14.80, totalSpent: 0.00 },
  { id: 4, name: 'seenu', phone: '+96894613183', totalDebt: 6.34, totalSpent: 5.09 },
  { id: 5, name: 'nabani office', phone: '+96899023619', totalDebt: 4.60, totalSpent: 0.00 },
  { id: 6, name: 'ameen staff', phone: '+96877091526', totalDebt: 3.50, totalSpent: 6.30 },
  { id: 7, name: 'devashish', phone: '+96898069355', totalDebt: 3.20, totalSpent: 0.00 },
  { id: 8, name: 'aysha sanad office', phone: '+96890996684', totalDebt: 2.80, totalSpent: 0.00 },
  { id: 9, name: 'rasaq golden', phone: '+96897628436', totalDebt: 2.00, totalSpent: 0.80 },
  { id: 10, name: 'exchange omani', phone: '+96899777185', totalDebt: 1.90, totalSpent: 2.50 },
  { id: 11, name: 'golden shiped', phone: '+96897628436', totalDebt: 1.70, totalSpent: 0.00 },
  { id: 12, name: 'Abu omantel', phone: '+96872677786', totalDebt: 0.35, totalSpent: 0.00 },
  { id: 13, name: 'Sulfi', phone: '+96878174811', totalDebt: 0.10, totalSpent: 0.00 },
  { id: 14, name: 'adnan dominoz', phone: '+96897507133', totalDebt: 0.05, totalSpent: 0.55 },
];

export const creditCustomersAllTime: CreditCustomer[] = [
  { id: 1, name: 'adnan', phone: '+96898675132', totalDebt: 389.01, totalSpent: 351.79 },
  { id: 2, name: 'on company', phone: '+96823456789', totalDebt: 253.46, totalSpent: 3.05 },
  { id: 3, name: 'Sulthan', phone: '+96894243794', totalDebt: 59.13, totalSpent: 26.25 },
  { id: 4, name: 'room', phone: '+96879732710', totalDebt: 45.55, totalSpent: 94.67 },
  { id: 5, name: 'golden shiped', phone: '+96897628436', totalDebt: 7.08, totalSpent: 12.45 },
  { id: 6, name: 'nabani office', phone: '+96899023619', totalDebt: 6.80, totalSpent: 261.61 },
  { id: 7, name: 'boss', phone: '+96894241634', totalDebt: 6.80, totalSpent: 0.00 },
  { id: 8, name: 'seenu', phone: '+96894613183', totalDebt: 6.34, totalSpent: 9.15 },
  { id: 9, name: 'tasleem', phone: '+96878547090', totalDebt: 5.85, totalSpent: 70.68 },
  { id: 10, name: 'devashish', phone: '+96898069355', totalDebt: 5.25, totalSpent: 59.24 },
  { id: 11, name: 'mess', phone: '+96896403340', totalDebt: 5.25, totalSpent: 38.55 },
  { id: 12, name: 'onik juice shop', phone: '+96877506899', totalDebt: 4.56, totalSpent: 13.30 },
  { id: 13, name: 'arial', phone: '+96880808080', totalDebt: 4.50, totalSpent: 0.70 },
  { id: 14, name: 'anwar arabian', phone: '+96878276729', totalDebt: 4.48, totalSpent: 1.45 },
  { id: 15, name: 'Jahir', phone: '+96890853704', totalDebt: 3.80, totalSpent: 0.00 },
  { id: 16, name: 'ameen staff', phone: '+96877091526', totalDebt: 3.50, totalSpent: 204.38 },
  { id: 17, name: 'aysha sanad office', phone: '+96890996684', totalDebt: 3.50, totalSpent: 30.40 },
  { id: 18, name: 'Hyderabad I res', phone: '+96890211799', totalDebt: 2.66, totalSpent: 13.89 },
  { id: 19, name: 'akshay brocoli', phone: '+96878760926', totalDebt: 2.34, totalSpent: 19.25 },
  { id: 20, name: 'jalw', phone: '+96878145854', totalDebt: 2.20, totalSpent: 0.00 },
];

// ======= Inventory / Stock Report =======
export interface InventoryItem {
  name: string;
  totalStockValue: number;
  inStock: number;
  sold: number;
  damaged: number;
  returnToSupplier: number;
  missing: number;
  expired: number;
}

export const inventoryReport: InventoryItem[] = [
  { name: '7days croissant', totalStockValue: 1.50, inStock: 10, sold: 386, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '303 SS Menthol', totalStockValue: 5.75, inStock: 5, sold: 114, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '303 SS Blue', totalStockValue: 0.00, inStock: 0, sold: 90, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'A4 sheet', totalStockValue: 11.90, inStock: 7, sold: 63, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'Af3cap', totalStockValue: 110.00, inStock: 44, sold: 47, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'A+ Lighter', totalStockValue: 1.80, inStock: 12, sold: 39, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '303 capsule', totalStockValue: 1.00, inStock: 1, sold: 39, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '7days mini croissant', totalStockValue: 0.00, inStock: 0, sold: 31, damaged: 0, returnToSupplier: 0, missing: 24, expired: 0 },
  { name: '7days swiss roll cocoa', totalStockValue: 0.07, inStock: 1, sold: 29, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '7Dayse hshwa', totalStockValue: 0.19, inStock: 1, sold: 18, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '7up 330ml', totalStockValue: 19.20, inStock: 96, sold: 0, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: '10 بسكوت ماري', totalStockValue: 25.60, inStock: 51, sold: 0, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'Afia cooking oil 1.5l', totalStockValue: 8.50, inStock: 5, sold: 5, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'Afia sunflower oil .75l', totalStockValue: 14.40, inStock: 16, sold: 0, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'ACTIIA LABAN', totalStockValue: 0.00, inStock: 0, sold: 13, damaged: 0, returnToSupplier: 0, missing: 12, expired: 0 },
  { name: '7 days cake bar', totalStockValue: 0.00, inStock: 0, sold: 13, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'aflh', totalStockValue: 0.00, inStock: 0, sold: 12, damaged: 0, returnToSupplier: 0, missing: 30, expired: 0 },
  { name: '3 pin', totalStockValue: 3.60, inStock: 8, sold: 9, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'Active despossible', totalStockValue: 1.20, inStock: 2, sold: 10, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
  { name: 'akmania', totalStockValue: 5.50, inStock: 22, sold: 19, damaged: 0, returnToSupplier: 0, missing: 0, expired: 0 },
];

// ======= Purchase Order Report =======
export interface PurchaseOrderItem {
  productName: string;
  salePrice: number;
  unitCost: number;
  quantity: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  totalItems: number;
  amount: number;
  status: string;
  date: string;
  items: PurchaseOrderItem[];
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: 'CXC23', supplier: '—', totalItems: 12, amount: 15.60, status: 'Completed', date: '08/09/2024', items: [{ productName: 'Chappal Footmark', salePrice: 1.50, unitCost: 1.30, quantity: 12, totalCost: 15.60 }] },
  { id: '9JFQB', supplier: '—', totalItems: 40, amount: 32.00, status: 'Completed', date: '08/09/2024', items: [{ productName: 'Manchester Blue Crush', salePrice: 0.90, unitCost: 0.80, quantity: 40, totalCost: 32.00 }] },
  { id: 'GDE80', supplier: 'glace ice cream', totalItems: 176, amount: 16.37, status: 'Completed', date: '08/08/2024', items: [
    { productName: 'glace raspberry blast stick', salePrice: 0.10, unitCost: 0.045, quantity: 40, totalCost: 1.80 },
    { productName: 'glace vanilla milky ice', salePrice: 0.10, unitCost: 0.045, quantity: 39, totalCost: 1.755 },
    { productName: 'glace cola blast', salePrice: 0.10, unitCost: 0.045, quantity: 5, totalCost: 0.225 },
    { productName: 'glace fruito punch', salePrice: 0.10, unitCost: 0.095, quantity: 22, totalCost: 2.09 },
    { productName: 'Glace Blast Mango', salePrice: 0.20, unitCost: 0.15, quantity: 70, totalCost: 10.50 },
  ]},
  { id: 'C70F3', supplier: 'glace ice cream', totalItems: 240, amount: 36.208, status: 'Completed', date: '08/08/2024', items: [
    { productName: 'glace raspberry twingo', salePrice: 0.20, unitCost: 0.18, quantity: 19, totalCost: 3.42 },
    { productName: 'glace Choco bar', salePrice: 0.15, unitCost: 0.12, quantity: 24, totalCost: 2.88 },
    { productName: 'glace super cone butterscotch', salePrice: 0.25, unitCost: 0.20, quantity: 26, totalCost: 5.20 },
    { productName: 'glace sando sandwich vanilla', salePrice: 0.20, unitCost: 0.15, quantity: 22, totalCost: 3.30 },
    { productName: 'glace shahi kulfi', salePrice: 0.20, unitCost: 0.18, quantity: 38, totalCost: 6.84 },
  ]},
  { id: 'QB37Q', supplier: 'golden backery', totalItems: 20, amount: 1.918, status: 'Completed', date: '08/08/2024', items: [
    { productName: 'goldenkuboos only', salePrice: 0.10, unitCost: 0.083, quantity: 6, totalCost: 0.498 },
    { productName: 'golden chicken fatheera', salePrice: 0.25, unitCost: 0.20, quantity: 2, totalCost: 0.40 },
    { productName: 'Golden donut crosent', salePrice: 0.10, unitCost: 0.085, quantity: 12, totalCost: 1.02 },
  ]},
  { id: 'AAVZO', supplier: 'sunich', totalItems: 210, amount: 22.35, status: 'Completed', date: '08/07/2024', items: [
    { productName: 'Sunrich Mojito200ml', salePrice: 0.15, unitCost: 0.125, quantity: 30, totalCost: 3.75 },
    { productName: 'Sunrich Lemonade200ml', salePrice: 0.15, unitCost: 0.12, quantity: 30, totalCost: 3.60 },
    { productName: 'sunich orange 200ml', salePrice: 0.15, unitCost: 0.10, quantity: 60, totalCost: 6.00 },
    { productName: 'Sunrich Apple200ml', salePrice: 0.15, unitCost: 0.12, quantity: 30, totalCost: 3.60 },
    { productName: 'Sunrich Peach200ml', salePrice: 0.15, unitCost: 0.08, quantity: 30, totalCost: 2.40 },
    { productName: 'Sunich Pomegranate 200ml', salePrice: 0.15, unitCost: 0.10, quantity: 30, totalCost: 3.00 },
  ]},
  { id: 'QL4TT', supplier: 'Adnan', totalItems: 96, amount: 24.00, status: 'Completed', date: '08/07/2024', items: [
    { productName: 'Kinza Lemon 300ml', salePrice: 0.30, unitCost: 0.25, quantity: 24, totalCost: 6.00 },
    { productName: 'Kinza Citrus 300ml', salePrice: 0.30, unitCost: 0.25, quantity: 24, totalCost: 6.00 },
    { productName: 'Kinza Diet Cola300ml', salePrice: 0.30, unitCost: 0.25, quantity: 24, totalCost: 6.00 },
    { productName: 'Kinza Orange 300ml', salePrice: 0.30, unitCost: 0.25, quantity: 24, totalCost: 6.00 },
  ]},
];

// ======= Transactions Report =======
export interface TransactionItem {
  id: string;
  customer: string;
  paymentType: string;
  date: string;
  status: string;
  barcode: string;
  description: string;
  currency: string;
  salePrice: number;
  quantity: number;
  vat: number;
  discountProduct: number;
  discountInvoice: number;
  revenue: number;
  cost: number;
  profit: number;
}

export const transactionsReport: TransactionItem[] = [
  { id: 'U0OBZ', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 22:00', status: 'Paid', barcode: '9501100482570', description: 'suroor Salt & vinegar', currency: 'OMR', salePrice: 0.05, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.05, cost: 0.05, profit: 0.00 },
  { id: '205X2', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 21:58', status: 'Paid', barcode: '9501100593672', description: 'Asafwah Laban', currency: 'OMR', salePrice: 0.10, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.33, cost: 0.22, profit: 0.12 },
  { id: 'QOXXN', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 21:47', status: 'Paid', barcode: 'Ginger', description: 'ginger', currency: 'OMR, Kilo', salePrice: 1.30, quantity: 0.08, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.10, cost: 0.06, profit: 0.04 },
  { id: '3SFYD', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 21:47', status: 'Paid', barcode: '230000000101', description: 'Hair comb round', currency: 'OMR', salePrice: 0.20, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.55, cost: 0.42, profit: 0.14 },
  { id: 'PG5PL', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 21:43', status: 'Paid', barcode: '6291003080197', description: 'Spada Chocolate cream wafer 20gm', currency: 'OMR', salePrice: 0.05, quantity: 2, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.10, cost: 0.06, profit: 0.04 },
  { id: 'ZPTEV', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 21:09', status: 'Paid', barcode: 'egg white', description: 'egg Waite', currency: 'OMR', salePrice: 0.08, quantity: 2, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.15, cost: 0.10, profit: 0.05 },
  { id: '51SS6', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:54', status: 'Paid', barcode: '8908003972220', description: 'Mario cardamom rusk', currency: 'OMR', salePrice: 0.60, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.60, cost: 0.40, profit: 0.20 },
  { id: 'X0DLE', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:54', status: 'Paid', barcode: '6291105470339', description: 'Suroor crispy potato chips', currency: 'OMR', salePrice: 0.05, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.30, cost: 0.23, profit: 0.07 },
  { id: 'AMLWI', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:43', status: 'Paid', barcode: '6074000006007', description: 'Mayan tomoto pastepcs', currency: 'OMR', salePrice: 0.08, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.08, cost: 0.05, profit: 0.03 },
  { id: 'OW6GJ', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:42', status: 'Paid', barcode: '5449000012203', description: 'SPRITE 1.5L', currency: 'OMR', salePrice: 0.60, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.60, cost: 0.50, profit: 0.10 },
  { id: 'FFC9R', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:33', status: 'Paid', barcode: '5449000054227', description: 'COCA COLA 1L', currency: 'OMR', salePrice: 0.45, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.45, cost: 0.40, profit: 0.05 },
  { id: '6LWWR', customer: 'Walkin Customer', paymentType: 'Cash', date: '09/08/2024 20:28', status: 'Paid', barcode: '6281006584235', description: 'lux.120g', currency: 'OMR', salePrice: 0.50, quantity: 1, vat: 0, discountProduct: 0, discountInvoice: 0, revenue: 0.90, cost: 0.65, profit: 0.25 },
];

// ======= Refund Report =======
export interface RefundItem {
  id: string;
  customer: string;
  paymentType: string;
  date: string;
  status: string;
  description: string;
  currency: string;
  salePrice: number;
  quantity: number;
  discount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export const refundsReport: RefundItem[] = [
  { id: '8MQZA', customer: 'Walkin Customer', paymentType: 'Cash', date: '08/08/2024 21:53', status: 'Refunded', description: 'Green apple', currency: 'OMR, Kilo', salePrice: 1.20, quantity: 0.28, discount: 0, revenue: 0.34, cost: 0.20, profit: 0.13 },
  { id: '6HTGI', customer: 'Walkin Customer', paymentType: 'Cash', date: '08/08/2024 21:07', status: 'Refunded', description: 'Hair comb pocket .100', currency: 'OMR', salePrice: 0.10, quantity: 4, discount: 0, revenue: 0.40, cost: 0.16, profit: 0.24 },
  { id: 'YAH6E', customer: 'Walkin Customer', paymentType: 'Cash', date: '08/08/2024 20:53', status: 'Refunded', description: 'huawei USB to type c', currency: 'OMR', salePrice: 2.50, quantity: 1, discount: 0.20, revenue: 2.30, cost: 1.00, profit: 1.30 },
  { id: 'D4QJO', customer: 'Walkin Customer', paymentType: 'Cash', date: '07/08/2024 23:05', status: 'Refunded', description: 'Manstrqueen', currency: 'OMR', salePrice: 0.70, quantity: 1, discount: 0, revenue: 0.80, cost: 0.58, profit: 0.22 },
  { id: '0EUTM', customer: 'Walkin Customer', paymentType: 'Cash', date: '07/08/2024 22:02', status: 'Refunded', description: 'Kinza Lemon 300ml', currency: 'OMR', salePrice: 0.30, quantity: 1, discount: 0, revenue: 0.90, cost: 0.75, profit: 0.15 },
  { id: '34WPX', customer: 'Walkin Customer', paymentType: 'Cash', date: '07/08/2024 12:35', status: 'Refunded', description: 'onion', currency: 'OMR, Kilo', salePrice: 0.60, quantity: 200, discount: 0, revenue: 228.85, cost: 152.96, profit: 75.89 },
  { id: 'NRGPF', customer: 'Walkin Customer', paymentType: 'Cash', date: '07/08/2024 10:14', status: 'Refunded', description: 'tomato new', currency: 'OMR, Kilo', salePrice: 0.50, quantity: 310, discount: 0, revenue: 155.50, cost: 124.40, profit: 31.10 },
  { id: 'HA564', customer: 'Walkin Customer', paymentType: 'Cash', date: '07/08/2024 09:31', status: 'Refunded', description: 'Goldman donut crosent', currency: 'OMR', salePrice: 0.10, quantity: 1, discount: 0, revenue: 73.10, cost: 58.49, profit: 14.62 },
  { id: 'UAX34', customer: 'Walkin Customer', paymentType: 'Cash', date: '06/08/2024 00:09', status: 'Partially refunded', description: 'mazoon fresh milk 200 ml', currency: 'OMR', salePrice: 0.20, quantity: 1, discount: 0, revenue: 2.20, cost: 1.50, profit: 0.71 },
  { id: 'V9NCG', customer: 'seenu', paymentType: 'Cash', date: '04/08/2024 21:17', status: 'Refunded', description: 'xinlemei cotton buds 80pcs', currency: 'OMR', salePrice: 0.25, quantity: 1, discount: 0, revenue: 1.00, cost: 0.84, profit: 0.16 },
  { id: 'CL9JJ', customer: 'Walkin Customer', paymentType: 'Cash', date: '04/08/2024 18:55', status: 'Refunded', description: 'Kinza Lemon 300ml', currency: 'OMR', salePrice: 0.30, quantity: 2, discount: 0, revenue: 0.60, cost: 0.50, profit: 0.10 },
  { id: 'ZHDUX', customer: 'Walkin Customer', paymentType: 'Cash', date: '02/08/2024 19:02', status: 'Refunded', description: 'almarai long life milk 1ltr', currency: 'OMR', salePrice: 0.55, quantity: 1, discount: 0, revenue: 2.05, cost: 1.90, profit: 0.15 },
  { id: 'HG3D1', customer: 'Walkin Customer', paymentType: 'Cash', date: '02/08/2024 18:47', status: 'Refunded', description: 'pran all time cookies', currency: 'OMR', salePrice: 0.80, quantity: 1, discount: 0, revenue: 0.80, cost: 0.40, profit: 0.40 },
  { id: 'Z4YAQ', customer: 'Walkin Customer', paymentType: 'Cash', date: '01/08/2024 20:46', status: 'Refunded', description: 'FANTA ORANGE 1L', currency: 'OMR', salePrice: 0.45, quantity: 1, discount: 0, revenue: 0.45, cost: 0.40, profit: 0.05 },
];
