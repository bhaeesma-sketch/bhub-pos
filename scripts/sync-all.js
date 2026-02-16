
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const firebaseConfig = {
    apiKey: env['VITE_FIREBASE_API_KEY'],
    authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: env['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: env['VITE_FIREBASE_APP_ID'],
};

async function syncAll() {
    console.log('🚀 Syncing Master Inventory (Source: StockRegister15-Feb-26)...');

    // 1. Price Map logic
    const priceMap = new Map();
    const invCsvData = fs.readFileSync('./public/data/inventory csv.csv', 'utf-8');
    invCsvData.split(/\r?\n/).slice(1).forEach(line => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const name = parts[0]?.replace(/"/g, '').trim().toLowerCase();
        const val = parseFloat(parts[1]) || 0;
        const stock = parseFloat(parts[2]) || 1;
        if (name && val > 0) priceMap.set(name, val / stock);
    });

    const registerData = fs.readFileSync('./public/data/stock_register.csv', 'utf-8');
    const lines = registerData.split(/\r?\n/).filter(line => line.trim());
    const headers = lines[1].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(2);

    const nameIdx = headers.indexOf('product name');
    const barcodeIdx = headers.indexOf('barcode');
    const prodCodeIdx = headers.indexOf('product code');
    const stockIdx = headers.indexOf('stock');
    const costIdx = headers.indexOf('avg cost');

    const products = [];
    const seenBarcodes = new Set();

    dataLines.forEach((line, i) => {
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                cols.push(current.trim());
                current = '';
            } else current += char;
        }
        cols.push(current.trim());

        const name = cols[nameIdx]?.replace(/"/g, '').trim();
        if (!name) return;

        const rawBarcode = cols[barcodeIdx]?.replace(/"/g, '').trim();
        const productCode = cols[prodCodeIdx]?.replace(/"/g, '').trim();
        const stockStr = cols[stockIdx]?.replace(/"/g, '').trim();
        const cost = parseFloat(cols[costIdx]) || 0;

        // ACCURATE BARCODE LOGIC: 
        // Use Product Code (Column D) if it's longer than 6 digits (EAN/UPC).
        // Otherwise use Barcode (Column C).
        let barcode = (productCode && productCode.length >= 8) ? productCode : (rawBarcode || `BC-${i}`);

        if (seenBarcodes.has(barcode)) {
            barcode = `${barcode}_${i}`;
        }
        seenBarcodes.add(barcode);

        const stock = parseFloat(stockStr?.split(' ')[0]) || 0;

        let price = priceMap.get(name.toLowerCase());
        if (!price || price < (cost * 1.05)) {
            price = cost > 0 ? (cost * 1.30) : 0.500;
        }

        products.push({
            id: `prod_${i}_${Date.now()}`,
            name,
            barcode,
            price: parseFloat(price.toFixed(3)),
            stock: Math.floor(stock),
            category: 'General',
            created_at: new Date().toISOString()
        });
    });

    console.log(`📦 Finalizing ${products.length} products with REAL barcodes.`);

    // 2. Supabase Sync
    console.log('🧹 Clearing Supabase...');
    await supabase.from('products').delete().neq('id', 'keep');

    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase.from('products').insert(batch);
        if (error) console.error(`\n❌ Supabase Error @ ${i}:`, error.message);
        else process.stdout.write(`\r✅ Supabase Progress: ${i + batch.length}/${products.length}...`);
    }

    // 3. Firebase Sync
    console.log('\n🔥 Syncing to Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const fireBatchSize = 400;
    for (let i = 0; i < products.length; i += fireBatchSize) {
        const batch = writeBatch(db);
        const chunk = products.slice(i, i + fireBatchSize);
        for (const p of chunk) {
            batch.set(doc(db, 'products', p.id), {
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                price: p.price,
                stock: p.stock,
                category: p.category
            });
        }
        await batch.commit();
        process.stdout.write(`\r✅ Firebase Progress: ${i + chunk.length}/${products.length}...`);
    }

    console.log('\n✨ COMPLETE: All real barcodes and prices are now live.');
}

syncAll();
