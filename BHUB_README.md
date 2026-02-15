# B-HUB Grocery Cloud POS System

## 🎯 Overview
Enterprise-grade Point of Sale system designed specifically for grocery retail operations in Oman. Built for Dukkantek tablet hardware with full mobile responsive dashboard.

## 🚀 Quick Start

### Access the System
- **POS Interface**: Navigate to `/bhub`
- **Manager Dashboard**: Navigate to `/bhub/manager`

### Login Credentials (Demo)
- **Store ID**: Any value (e.g., "STORE001")
- **Username**: Any value (e.g., "cashier")
- **Password**: Minimum 6 characters

## 🏪 Features

### 1. Enterprise Authentication
- **Store ID + Username/Password** authentication
- "Remember Store" functionality
- Automatic shift detection
- Role-based access control

### 2. Shift Management
- Opening cash drawer count
- Quick amount buttons (50, 100, 200, 500 OMR)
- Shift tracking and reporting
- Secure shift closure

### 3. Advanced Barcode Support
- **HID Scanner Integration**: Auto-increment quantity on scan
- **GS1 DataBar Support**: Weight-embedded barcodes for loose items
  - Prefix 20-21: Price-embedded
  - Prefix 22-29: Weight-embedded
- Real-time barcode processing without UI refresh

### 4. Multi-Unit Product Support
- Piece, Pack, Carton, Kilogram
- Dynamic unit conversion
- Weight-based pricing for vegetables/fruits

### 5. Oman VAT Compliance
- Fixed 5% VAT calculation
- Transparent VAT display:
  - Subtotal (Ex VAT)
  - VAT Amount
  - Subtotal (Inc VAT)
- OTA e-invoicing ready

### 6. Customer Loyalty System
- Phone number lookup
- Tiered discount system
- Loyalty points tracking
- Automatic discount application

### 7. High-Speed Checkout
- **Quick-Pay Buttons**: 5, 10, 20, 50 OMR
- One-touch exact cash payment
- Instant change calculation
- Fast-moving product shortcuts

### 8. Manager Dashboard (Mobile Responsive)
- **Live Sales Monitoring**: Real-time OMR tracking
- **Inventory Alerts**: Low stock notifications
- **Staff Performance**: Active staff tracking
- **Hourly Sales Chart**: Visual analytics
- **Top Products**: Best sellers by revenue
- Full RTL (Arabic/English) support

## 🎨 Design System

### Colors
- **Background**: Deep Charcoal (#121212)
- **Cards**: Dark Gray (#1E1E1E, #2A2A2A)
- **Primary**: B-HUB Gold (#D4AF37)
- **Success**: Safety Green (#28a745)
- **Borders**: Subtle Gray (#374151)

### Layout (Tablet - 1280x800)
- **Left Panel (60%)**: Product grid with fast-moving category
- **Right Panel (40%)**: Live cart with customer lookup

### Touch Targets
- Large square tiles for loose items (Tomatoes, Onions, etc.)
- Minimum 44x44px touch areas
- High-contrast hover states

## 📱 Responsive Breakpoints
- **Tablet**: 1280x800 (landscape optimized)
- **Mobile**: Full responsive dashboard
- **Desktop**: Scales up gracefully

## 🔧 Technical Stack
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **Routing**: React Router v6

## 🌐 Bilingual Support (RTL)
All UI elements include:
- English labels
- Arabic translations (العربية)
- Proper RTL text direction
- Cultural number formatting

## 📊 Product Categories
- **Fast-Moving**: Bread, Milk, Water, Eggs
- **Vegetables**: Tomatoes, Onions (weight-based)
- **Dairy**: Milk, Yogurt, Cheese
- **Beverages**: Water, Juice, Soft drinks

## 🔐 Security Features
- No PIN-only access (enterprise requirement)
- Session management
- Shift-based access control
- Audit trail ready

## 🎯 Grocery-Specific Features
1. **Weight-Based Items**: Automatic kg/price calculation
2. **Loose Item Tiles**: Quick-add for non-barcoded items
3. **Fast-Moving Category**: Priority access to high-turnover items
4. **Multi-Unit Toggle**: Same SKU, different packaging
5. **Customer Loyalty**: Phone-based discount system

## 📈 Manager Insights
- Today's sales (OMR)
- Transaction count
- Low stock alerts
- Active staff count
- Peak hour identification
- Top product revenue

## 🚦 Workflow
1. **Login** → Store ID + Username/Password
2. **Shift Start** → Enter opening cash
3. **POS Operation** → Scan/add products
4. **Customer Lookup** → Optional loyalty discount
5. **Checkout** → Quick-pay or exact amount
6. **Shift End** → Cash reconciliation

## 🔄 State Management
- Empty Cart: Centered empty state with icon
- Item Added: Instant cart update (no refresh)
- Checkout Success: Clear cart + receipt generation

## 📝 Notes
- All prices in Omani Rial (OMR) with 3 decimal places
- Barcode scanner uses HID protocol (keyboard wedge)
- GS1 barcodes auto-parsed for weight/price
- Manager dashboard updates in real-time

## 🎨 Brand Identity
**B-HUB** - Premium grocery cloud POS
- Gold accent for premium feel
- Dark mode for reduced eye strain
- Green for positive actions (PAY button)
- Professional Arabic typography

---

**Version**: 2.0  
**Support**: support@bhub.om  
**Powered by**: B-HUB Cloud Systems
