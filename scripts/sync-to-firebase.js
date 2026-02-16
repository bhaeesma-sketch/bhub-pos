
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
);

const firebaseConfig = {
    apiKey: env['VITE_FIREBASE_API_KEY'],
    authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
    projectId: env['VITE_FIREBASE_PROJECT_ID'],
    storageBucket: env['VITE_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
    appId: env['VITE_FIREBASE_APP_ID'],
};

async function syncToFirebase() {
    console.log('🔥 Syncing Comprehensive Inventory to Firebase Firestore...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const csvData = fs.readFileSync('./public/data/inventory csv.csv', 'utf-8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    const nameIdx = headers.findIndex(h => h.includes('product name'));
    const stockIdx = headers.findIndex(h => h.includes('in stock'));
    const totalValueIdx = headers.findIndex(h => h.includes('total stock value'));

    const productMap = new Map();
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
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
        const stock = parseFloat(cols[stockIdx]) || 0;
        const totalStockValue = parseFloat(cols[totalValueIdx]) || 0;
        if (!name || name === 'Product name' || name.includes(',,,,')) continue;

        if (productMap.has(name)) {
            const existing = productMap.get(name);
            existing.stock += stock;
            existing.totalValue += totalStockValue;
        } else {
            productMap.set(name, { stock, totalValue: totalStockValue });
        }
    }

    const products = [];
    let idx = 1;
    for (const [name, data] of productMap.entries()) {
        let price = data.stock > 0 ? (data.totalValue / data.stock) : 0;
        if (price === 0 && data.totalValue > 0) price = data.totalValue;
        if (price === 0) price = 0.500;

        products.push({
            id: `prod_${idx++}`,
            name,
            price: parseFloat(price.toFixed(3)),
            stock: Math.floor(data.stock),
            barcode: name,
            category: 'General'
        });
    }

    console.log(`📦 Prepared ${products.length} unique products for Firebase.`);

    const batchSize = 400;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = products.slice(i, i + batchSize);
        for (const product of chunk) {
            const ref = doc(db, 'products', product.id);
            batch.set(ref, product);
        }
        await batch.commit();
        process.stdout.write(`\r✅ Progress: ${i + chunk.length}/${products.length} products synced to Firebase...`);
    }

    console.log('\n✨ Firebase Sync Completed.');
}

syncToFirebase();
