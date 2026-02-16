/**
 * ESC/POS Thermal Printing Utility for B-HUB POS (80mm)
 * Uses Web Bluetooth API to connect directly to generic thermal printers.
 */

const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const FEED = '\x0A';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_SIZE = GS + '!' + '\x11';
const NORMAL_SIZE = GS + '!' + '\x00';

export async function printReceiptBluetooth(data: {
    storeName: string;
    invoiceNo: string;
    date: string;
    items: any[];
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
    qrCode?: string;
}) {
    try {
        // Request Bluetooth Device
        const device = await (navigator as any).bluetooth.requestDevice({
            filters: [
                { services: ['00001101-0000-1000-8000-00805f9b34fb'] }, // Standard Serial Port Profile
                { namePrefix: 'Inner' },
                { namePrefix: 'RP80' },
                { namePrefix: 'Thermal' },
                { namePrefix: 'BT' },
                { namePrefix: 'POS' }
            ],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

        const encoder = new TextEncoder();

        // Construction of Receipt Content
        let commands = INIT;

        // Header
        commands += ALIGN_CENTER + DOUBLE_SIZE + BOLD_ON + data.storeName + FEED + NORMAL_SIZE + BOLD_OFF;
        commands += "BHAEES CLOUD POS" + FEED;
        commands += "--------------------------------" + FEED;
        commands += ALIGN_LEFT + "Invoice: " + data.invoiceNo + FEED;
        commands += "Date: " + data.date + FEED;
        commands += "--------------------------------" + FEED;

        // Items Table
        commands += "ITEM            QTY    TOTAL    " + FEED;
        commands += "--------------------------------" + FEED;

        data.items.forEach((item: any) => {
            const name = (item.productName || item.product.name).substring(0, 15).padEnd(16);
            const qty = item.quantity.toString().padEnd(7);
            const total = item.unitPrice ? (item.unitPrice * item.quantity).toFixed(3) : "0.000";
            commands += name + qty + total + FEED;
        });

        commands += "--------------------------------" + FEED;

        // Totals
        commands += ALIGN_RIGHT_POS() + "Subtotal: " + data.totals.subtotal.toFixed(3) + FEED;
        commands += "VAT (5% Incl.): " + data.totals.tax.toFixed(3) + FEED;
        commands += BOLD_ON + "TOTAL: " + data.totals.total.toFixed(3) + BOLD_OFF + FEED;
        commands += FEED;

        // Footer
        commands += ALIGN_CENTER + "Thank You for your visit!" + FEED;
        commands += "شكراً لزيارتكم!" + FEED;

        // Space for QR code (most thermal printers need specialized bit-image commands for QR)
        // For simplicity in this demo, we assume the printer handles native QR or we print the text
        if (data.qrCode) {
            commands += FEED + "SCAN FOR E-INVOICE" + FEED + FEED;
        }

        commands += FEED + FEED + FEED + FEED + FEED; // Cut distance

        // Split into chunks if necessary (standard MTU is ~20 bytes, but many handle more)
        const chunk = encoder.encode(commands);
        await characteristic.writeValue(chunk);

        await device.gatt.disconnect();
        return true;
    } catch (error) {
        console.error('Bluetooth Print Error:', error);
        throw error;
    }
}

function ALIGN_RIGHT_POS() { return ESC + 'a' + '\x02'; }
