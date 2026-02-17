
/**
 * Omani Tax Authority (Fawtara) / ZATCA Compatible TLV (Tag-Length-Value) Encoding
 * Implementation for QR Code Generation on Receipts.
 * Browser-compatible implementation using Uint8Array.
 */

export interface TLVData {
    sellerName: string;
    vatNumber: string;
    timestamp: string; // ISO 8601
    totalWithVat: string;
    vatAmount: string;
    invoiceCount: string;
}

/**
 * Returns a TLV encoded Uint8Array for a given tag and value string.
 */
function toTLV(tag: number, value: string): Uint8Array {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    const length = valueBytes.length;

    // Create a new array of size: 1 (tag) + 1 (length) + valueBytes.length

    const tlv = new Uint8Array(2 + length);
    tlv[0] = tag;
    tlv[1] = length;
    tlv.set(valueBytes, 2);

    return tlv;
}

/**
 * Concatenates multiple Uint8Arrays
 */
function concatArrays(arrays: Uint8Array[]): Uint8Array {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Encodes a Uint8Array to Base64 (browser compatible)
 */
function toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Generates the Base64 TLV string for the QR code
 */
export function generateFawtaraQR(data: any): string {
    try {
        const buffers = [
            toTLV(1, data.sellerName || ''),
            toTLV(2, data.vatNumber || ''),
            toTLV(3, data.timestamp || new Date().toISOString()),
            toTLV(4, data.totalWithVat || '0.000'),
            toTLV(5, data.vatAmount || '0.000'),
        ];

        const combined = concatArrays(buffers);
        return toBase64(combined);
    } catch (error) {
        console.error('Error generating Fawtara QR:', error);
        return '';
    }
}
