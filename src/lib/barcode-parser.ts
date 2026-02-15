import { BarcodeData } from '@/types/bhub';

/**
 * B-HUB Barcode Parser
 * Supports:
 * 1. Standard EAN-13/UPC barcodes
 * 2. GS1 DataBar for weight-embedded pricing (Prefix 20-29)
 */
export class BarcodeParser {
    /**
     * Parse barcode and determine type
     * GS1 Weight Format: 2PPPPPWWWWWC
     * - 2: Prefix for weight items
     * - PPPPP: Product code (5 digits)
     * - WWWWW: Weight in grams (5 digits) OR Price in fils (5 digits)
     * - C: Check digit
     */
    static parse(barcode: string): BarcodeData {
        // Remove any whitespace
        const cleaned = barcode.trim();

        // Check for GS1 weight-based barcode (Prefix 20-29)
        if (cleaned.length === 13 && cleaned.startsWith('2')) {
            const prefix = cleaned.substring(0, 2);

            if (prefix >= '20' && prefix <= '29') {
                return this.parseGS1WeightBarcode(cleaned);
            }
        }

        // Standard barcode
        return {
            raw: cleaned,
            type: 'standard',
            productCode: cleaned,
        };
    }

    private static parseGS1WeightBarcode(barcode: string): BarcodeData {
        // Format: 2PPPPPWWWWWC
        const prefix = barcode.substring(0, 2);
        const productCode = barcode.substring(2, 7);
        const weightOrPriceRaw = barcode.substring(7, 12);
        const checkDigit = barcode.substring(12, 13);

        // Determine if it's weight or price based on prefix
        // 20-21: Price embedded
        // 22-29: Weight embedded
        const isPriceEmbedded = prefix >= '20' && prefix <= '21';

        if (isPriceEmbedded) {
            // Price in fils (1 OMR = 1000 fils)
            const priceInFils = parseInt(weightOrPriceRaw, 10);
            const price = priceInFils / 1000;

            return {
                raw: barcode,
                type: 'gs1-weight',
                productCode,
                price,
            };
        } else {
            // Weight in grams
            const weightInGrams = parseInt(weightOrPriceRaw, 10);
            const weight = weightInGrams / 1000; // Convert to kg

            return {
                raw: barcode,
                type: 'gs1-weight',
                productCode,
                weight,
            };
        }
    }

    /**
     * Generate GS1 barcode for weight-based items
     * Used for testing or manual entry
     */
    static generateWeightBarcode(productCode: string, weightKg: number): string {
        const prefix = '22'; // Weight-based prefix
        const paddedCode = productCode.padStart(5, '0').substring(0, 5);
        const weightGrams = Math.round(weightKg * 1000);
        const paddedWeight = weightGrams.toString().padStart(5, '0').substring(0, 5);

        // Simple check digit (not full EAN-13 algorithm for brevity)
        const checkDigit = '0';

        return `${prefix}${paddedCode}${paddedWeight}${checkDigit}`;
    }

    static generatePriceBarcode(productCode: string, priceOMR: number): string {
        const prefix = '20'; // Price-based prefix
        const paddedCode = productCode.padStart(5, '0').substring(0, 5);
        const priceFils = Math.round(priceOMR * 1000);
        const paddedPrice = priceFils.toString().padStart(5, '0').substring(0, 5);

        const checkDigit = '0';

        return `${prefix}${paddedCode}${paddedPrice}${checkDigit}`;
    }
}
