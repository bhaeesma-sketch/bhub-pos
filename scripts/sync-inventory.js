
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read .env manually since we don't want to install dotenv for one script
const envContent = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    console.log('🚀 Syncing inventory from CSV...');

    const csvData = fs.readFileSync('./public/data/inventory csv.csv', 'utf-8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim());
    const headers = lines[0].split(',');

    // Find column indexes
    const nameIdx = headers.findIndex(h => h.toLowerCase().includes('product name'));
    const stockIdx = headers.findIndex(h => h.toLowerCase().includes('in stock'));
    const costIdx = headers.findIndex(h => h.toLowerCase().includes('total stock value'));

    if (nameIdx === -1 || stockIdx === -1) {
        console.error('CSV headers mismatch. Found:', headers);
        process.exit(1);
    }

    console.log('🔍 Fetching existing products...');
    const { data: existing, error: fetchErr } = await supabase.from('products').select('id, name');
    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        process.exit(1);
    }

    const nameMap = new Map(existing.map(p => [p.name.toLowerCase().trim(), p.id]));
    console.log(`✅ Mapping ${existing.length} current products.`);

    const updates = [];
    for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter that handles quotes moderately
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const name = cols[nameIdx]?.replace(/"/g, '').trim();
        const stockValue = cols[stockIdx]?.trim();

        if (!name) continue;

        const id = nameMap.get(name.toLowerCase());
        if (id) {
            updates.push({
                id,
                stock: parseFloat(stockValue) || 0,
                cost: costIdx !== -1 ? (parseFloat(cols[costIdx]) || 0) : undefined,
                updated_at: new Date().toISOString()
            });
        }
    }

    console.log(`📈 Updating ${updates.length} items...`);

    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in batch ${i}:`, error);
        process.stdout.write('.');
    }

    console.log('\n✨ Inventory Sync Finalized.');
}

sync();
