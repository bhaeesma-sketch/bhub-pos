import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Product } from '@/types/bhub';
import { offlineDb } from '@/lib/offlineDb';
import { cloudSync } from '@/lib/bhub-cloud-sync';
import { db as firebaseDb } from '@/lib/firebase-init';
import { collection, writeBatch, doc } from 'firebase/firestore';

interface ImportStats {
    updated: number;
    added: number;
    errors: string[];
}

export const BulkImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState<ImportStats | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDownloadTemplate = () => {
        // CSV Template: Barcode,Name,Category,Cost Price,Sale Price,Current Stock
        const template = 'Barcode,Name,Category,Cost Price,Sale Price,Current Stock\n12345678,Example Product,Grocery,0.500,0.750,100';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bhub_inventory_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStats(null);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStats({ updated: 0, added: 0, errors: [] });
        setProgress(5);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                let updatedCount = 0;
                let addedCount = 0;
                const errors: string[] = [];
                const batchSize = 400; // Firestore limit per batch is 500

                try {
                    // Pre-fetch all products from offline DB for quick lookup
                    // This assumes offlineDb is sync source of truth locally.
                    // In a real cloud scenario, we might want to check cloud, but for speed
                    // and "offline-first" ethos, local is good.
                    // However, for correct IDs from cloud, it's tricky if they differ.
                    // Let's rely on Barcode being the key linkage.
                    const existingProducts = await offlineDb.getAllProducts();
                    const productMap = new Map(existingProducts.map(p => [p.barcode, p]));

                    let currentBatch = writeBatch(firebaseDb);
                    let batchCount = 0;
                    let productsToSave: Product[] = [];

                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const barcode = row['Barcode']?.trim();
                        const name = row['Name']?.trim();
                        const category = row['Category']?.trim() || 'General';
                        const cost = parseFloat(row['Cost Price'] || '0');
                        const price = parseFloat(row['Sale Price'] || '0');
                        const stock = parseInt(row['Current Stock'] || '0');

                        // Validation
                        if (!barcode) {
                            errors.push(`Row ${i + 2}: Missing Barcode`);
                            continue;
                        }
                        if (!price || isNaN(price)) {
                            errors.push(`Row ${i + 2}: Invalid Price for ${name || barcode}`);
                            continue; // Skip if price invalid? Or allow 0? User said "Missing Price -> Skip"
                        }

                        // Check if exists
                        const existing = productMap.get(barcode);
                        let product: Product;

                        if (existing) {
                            // Update
                            product = {
                                ...existing,
                                price: price, // Update Price
                                cost: cost > 0 ? cost : existing.cost, // Update Cost if provided
                                stock: stock, // REPLACE Stock (User requirement: "Physical Stock count I upload becomes NEW Current Stock")
                                category: category || existing.category,
                                name: name || existing.name
                            };
                            updatedCount++;
                        } else {
                            // Create New
                            product = {
                                id: `PROD-${Date.now()}-${i}`, // Generate ID
                                storeId: 'STORE001', // Default
                                barcode,
                                name: name || 'New Item',
                                category,
                                price,
                                cost,
                                stock,
                                unit: 'piece',
                                vatRate: 0.05,
                                isWeightBased: false,
                                isFastMoving: false
                            };
                            addedCount++;
                        }

                        // Add to batch
                        // Use existing ID if update, new ID if create
                        const ref = doc(firebaseDb, 'products', product.id);
                        currentBatch.set(ref, product);
                        batchCount++;
                        productsToSave.push(product);

                        // Cloud Commit every 400
                        if (batchCount >= batchSize) {
                            await currentBatch.commit();
                            currentBatch = writeBatch(firebaseDb);
                            batchCount = 0;
                            // Update progress
                            setProgress(Math.round(((i + 1) / rows.length) * 90));
                        }
                    }

                    // Commit final batch
                    if (batchCount > 0) {
                        await currentBatch.commit();
                    }

                    // Sync to Local DB
                    await offlineDb.saveProducts(productsToSave);

                    setProgress(100);
                    setStats({ updated: updatedCount, added: addedCount, errors });
                    setTimeout(() => {
                        setUploading(false);
                        // Do NOT auto-close, let user see stats
                    }, 500);

                } catch (error) {
                    console.error('Import failed:', error);
                    setStats(prev => ({ ...prev!, errors: [...prev!.errors, 'System Error: ' + (error as Error).message] }));
                    setUploading(false);
                }
            },
            error: (error) => {
                console.error('CSV Parsing Error:', error);
                setUploading(false);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Bulk Inventory Import</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Step 1: Template */}
                    <div className="bg-[#2A2A2A] p-4 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-400 mb-3">1. Download the format template</p>
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full py-2 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white rounded-lg text-sm border border-gray-600 transition"
                        >
                            ⬇ Download CSV Template
                        </button>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="bg-[#2A2A2A] p-4 rounded-xl border border-gray-700">
                        <p className="text-sm text-gray-400 mb-3">2. Upload your file</p>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileChange}
                        />

                        {!file ? (
                            <div
                                onClick={() => inputRef.current?.click()}
                                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition"
                            >
                                <p className="text-gray-400">Click to select CSV file</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-[#1E1E1E] p-3 rounded-lg border border-gray-700">
                                <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                                <button onClick={() => setFile(null)} className="text-red-400 text-sm hover:underline">Change</button>
                            </div>
                        )}
                    </div>

                    {/* Progress & Stats */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {stats && !uploading && (
                        <div className="bg-green-900/20 border border-green-800 p-4 rounded-xl text-sm">
                            <p className="text-green-400 font-bold mb-1">✅ Import Completed!</p>
                            <ul className="space-y-1 text-gray-300">
                                <li>Updated Products: <span className="text-white font-bold">{stats.updated}</span></li>
                                <li>New Products Added: <span className="text-white font-bold">{stats.added}</span></li>
                            </ul>
                            {stats.errors.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-green-800/30">
                                    <p className="text-red-400 font-bold mb-1">⚠️ Ignored Rows ({stats.errors.length})</p>
                                    <div className="max-h-24 overflow-y-auto text-xs text-red-300 space-y-1">
                                        {stats.errors.map((err, i) => <div key={i}>{err}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#B5952F] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {uploading ? 'Processing...' : 'Start Import'}
                    </button>
                </div>

            </div>
        </div>
    );
};
