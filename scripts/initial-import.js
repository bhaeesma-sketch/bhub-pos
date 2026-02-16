
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function importAll() {
    console.log('🚀 Starting Final Inventory Sync with Correct Schema...');

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
            id: `prod_${idx++}_${Date.now()}`,
            name,
            price: parseFloat(price.toFixed(3)),
            stock: Math.floor(data.stock),
            barcode: name, // Using Name as Barcode for scannability
            category: 'General',
            created_at: new Date().toISOString()
        });
    }

    console.log(`📦 Prepared ${products.length} products for upload.`);

    console.log('🧹 Clearing old products...');
    await supabase.from('products').delete().neq('id', 'keep');

    const batchSize = 100;
    let completed = 0;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase.from('products').insert(batch);

        if (error) {
            console.error(`\n❌ Error at batch starting ${i}:`, error.message);
        } else {
            completed += batch.length;
            process.stdout.write(`\r✅ Progress: ${completed}/${products.length} products updated...`);
        }
    }

    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`\n✨ Sync Completed. Database now contains ${count} products.`);
}

importAll();
