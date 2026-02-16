import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Product } from '@/types/bhub';
import { offlineDb } from '@/lib/offlineDb';
import { SupabaseBackend } from '@/lib/supabase-backend';
import { db as firebaseDb } from '@/lib/firebase-init';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ImportStats {
    updated: number;
    added: number;
    errors: string[];
}

export const BulkImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState<ImportStats | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDownloadTemplate = () => {
        const template = 'Barcode,Name,Category,Cost Price,Sale Price,Current Stock\n12345678,Example Product,Grocery,0.500,0.750,100';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_template.csv';
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

    const findColumn = (row: any, aliases: string[]): string | undefined => {
        const keys = Object.keys(row);
        for (const alias of aliases) {
            // Check exact, check includes (for bilingual headers like "Barcode / الباركود")
            const foundKey = keys.find(k => {
                const cleanK = k.toLowerCase().trim();
                const cleanAlias = alias.toLowerCase().trim();
                return cleanK === cleanAlias || cleanK.includes(cleanAlias) || cleanAlias.includes(cleanK);
            });
            if (foundKey) return row[foundKey];
        }
        return undefined;
    };

    const processData = async (rows: any[]) => {
        if (rows.length === 0) {
            setStats({ updated: 0, added: 0, errors: ['File is empty or headers are missing'] });
            setUploading(false);
            return;
        }

        let updatedCount = 0;
        let addedCount = 0;
        const errors: string[] = [];
        const productsToSave: Product[] = [];

        try {
            // Pre-fetch all products
            const existingProducts = await offlineDb.getAllProducts();
            const productMap = new Map(existingProducts.map(p => [p.barcode, p]));
            const nameMap = new Map(existingProducts.map(p => [p.name.toLowerCase().trim(), p]));

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Smart Header Mapping
                const barcode = findColumn(row, ['Product Code', 'Barcode', 'SKU', 'Bar Code', 'Code', 'Item Code', 'ItemCode', 'Id'])?.toString().trim();
                const name = findColumn(row, ['Name', 'Product Name', 'Item Name', 'Product name', 'Description', 'Label'])?.toString().trim();
                const category = findColumn(row, ['Category', 'Dept', 'Department', 'Group', 'Type'])?.toString().trim() || 'General';
                const cost = parseFloat(findColumn(row, ['Avg Cost', 'Cost Price', 'Cost', 'Unit Cost', 'Buying Price', 'Purchase Price', 'Total stock value ']) || '0');
                const price = parseFloat(findColumn(row, ['Sale Price', 'Price', 'Selling Price', 'Unit Price', 'MRP', 'Value']) || '0');
                const stock = parseInt(findColumn(row, ['Current Stock', 'Stock', 'Quantity', 'Qty', 'In Stock', 'Count', 'stock']) || '0');

                // Validation
                if (!barcode && !name) {
                    errors.push(`Row ${i + 2}: Missing both Name and Barcode/ID`);
                    continue;
                }

                // Match by barcode first, then by name
                let existing = barcode ? productMap.get(barcode) : undefined;
                if (!existing && name) {
                    existing = nameMap.get(name.toLowerCase().trim());
                }

                let product: Product;

                if (existing) {
                    product = {
                        ...existing,
                        price: price > 0 ? price : existing.price,
                        cost: cost > 0 ? cost : existing.cost,
                        stock: !isNaN(stock) ? stock : existing.stock,
                        category: category || existing.category,
                        name: name || existing.name
                    };
                    updatedCount++;
                } else {
                    if (isNaN(price) || price <= 0) {
                        errors.push(`Row ${i + 2}: Skipped new product "${name || barcode}" due to invalid price`);
                        continue;
                    }

                    const id = `PROD-${Date.now()}-${i}`;
                    product = {
                        id,
                        storeId: 'STORE001',
                        barcode: barcode || `TEMP-${id}`,
                        sku: barcode || id,
                        name: name || 'New Item',
                        category,
                        price,
                        cost,
                        stock: !isNaN(stock) ? stock : 0,
                        unit: 'piece',
                        vatRate: 0.05,
                        isWeightBased: false,
                        isFastMoving: false
                    };
                    addedCount++;
                }
                productsToSave.push(product);
            }

            if (productsToSave.length > 0) {
                // 1. Sync to Supabase (Master Inventory)
                setProgress(40);
                await SupabaseBackend.upsertProducts(productsToSave);

                // 2. Sync to Firestore (Cloud Remote View)
                setProgress(70);
                let currentBatch = writeBatch(firebaseDb);
                let batchCount = 0;
                for (const product of productsToSave) {
                    const ref = doc(firebaseDb, 'products', product.id);
                    currentBatch.set(ref, product);
                    batchCount++;
                    if (batchCount >= 400) {
                        await currentBatch.commit();
                        currentBatch = writeBatch(firebaseDb);
                        batchCount = 0;
                    }
                }
                if (batchCount > 0) await currentBatch.commit();

                // 3. Sync to Local Offline DB
                setProgress(90);
                await offlineDb.saveProducts(productsToSave);

                // 4. Refresh UI State
                queryClient.invalidateQueries({ queryKey: ['products'] });
                queryClient.invalidateQueries({ queryKey: ['categories'] });
            }

            setProgress(100);
            setStats({ updated: updatedCount, added: addedCount, errors });
            toast.success('Inventory Import Completed');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Import failed:', error);
            setStats(prev => ({
                updated: prev?.updated || 0,
                added: prev?.added || 0,
                errors: [...(prev?.errors || []), 'System Error: ' + (error as Error).message]
            }));
        } finally {
            setUploading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStats({ updated: 0, added: 0, errors: [] });
        setProgress(5);

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                complete: (results) => processData(results.data),
                error: (error) => {
                    console.error('CSV Parsing Error:', error);
                    setUploading(false);
                    toast.error('Failed to parse CSV file');
                }
            });
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                processData(json);
            } catch (error) {
                console.error('Excel Parsing Error:', error);
                setUploading(false);
                toast.error('Failed to parse Excel file');
            }
        } else {
            setUploading(false);
            toast.error('Unsupported file format. Please use CSV or Excel.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-lg rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <h2 className="text-xl font-bold text-foreground">Bulk Inventory Import</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Step 1: Template */}
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                        <p className="text-sm text-muted-foreground mb-3 font-medium">1. Prepare your inventory file</p>
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full py-2 bg-secondary hover:bg-accent text-foreground rounded-lg text-sm border border-border transition-colors font-semibold"
                        >
                            ⬇ Download Sample Format
                        </button>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            Supported headers: Barcode, Name, Category, Price, Stock, Cost
                        </p>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                        <p className="text-sm text-muted-foreground mb-3 font-medium">2. Select CSV File</p>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                        />

                        {!file ? (
                            <div
                                onClick={() => inputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                                <p className="text-muted-foreground text-sm">Click to browse your computer</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-primary/30">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">📊</div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground truncate max-w-[180px]">{file.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <button onClick={() => setFile(null)} className="text-destructive text-xs font-bold hover:underline">REMOVE</button>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="space-y-3 animate-pulse">
                            <div className="flex justify-between text-xs font-bold text-primary">
                                <span className="uppercase tracking-widest">Processing Inventory...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Results Stats */}
                    {stats && !uploading && (
                        <div className="bg-success/10 border border-success/30 p-5 rounded-xl">
                            <h3 className="text-success font-bold text-sm mb-3 border-b border-success/20 pb-2">IMPORT SUMMARY</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card/50 p-2 rounded border border-border text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase">Added</p>
                                    <p className="text-xl font-bold text-primary">{stats.added}</p>
                                </div>
                                <div className="bg-card/50 p-2 rounded border border-border text-center">
                                    <p className="text-[10px] text-muted-foreground uppercase">Updated</p>
                                    <p className="text-xl font-bold text-info">{stats.updated}</p>
                                </div>
                            </div>

                            {stats.errors.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-success/20">
                                    <p className="text-destructive font-bold text-[11px] mb-2 uppercase tracking-tight">Blocked Rows ({stats.errors.length})</p>
                                    <div className="max-h-24 overflow-y-auto text-[10px] text-destructive/80 space-y-1 bg-destructive/5 p-2 rounded">
                                        {stats.errors.map((err, i) => <div key={i}>• {err}</div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/10">
                    <button onClick={onClose} className="px-5 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">CANCEL</button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        {uploading ? 'UPLOADING...' : 'START IMPORT'}
                    </button>
                </div>
            </div>
        </div>
    );
};
