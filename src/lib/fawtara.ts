
/**
 * Omani Tax Authority (Fawtara) / ZATCA Compatible TLV (Tag-Length-Value) Encoding
 * Implementation for QR Code Generation on Receipts.
 */

export interface TLVData {
    sellerName: string;
    vatNumber: string;
    timestamp: string; // ISO 8601
    totalWithVat: string;
    vatAmount: string;
}

/**
 * Returns a TLV encoded buffer for a given tag, length, and value
 */
function toTLVByte(tag: number, value: string): Buffer {
    const tagBuf = Buffer.from([tag]);
    const valBuf = Buffer.from(value, 'utf-8');
    const lenBuf = Buffer.from([valBuf.length]);
    return Buffer.concat([tagBuf, lenBuf, valBuf]);
}

/**
 * Generates the Base64 TLV string for the QR code
 */
export function generateFawtaraQR(data: TLVData): string {
    try {
        const buffers = [
            toTLVByte(1, data.sellerName),
            toTLVByte(2, data.vatNumber),
            toTLVByte(3, data.timestamp),
            toTLVByte(4, data.totalWithVat),
            toTLVByte(5, data.vatAmount),
        ];

        const combined = Buffer.concat(buffers);
        return combined.toString('base64');
    } catch (error) {
        console.error('Error generating Fawtara QR:', error);
        return '';
    }
}
