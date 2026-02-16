import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

interface ReceiptProps {
    storeName: string;
    vatin: string;
    invoiceNo: string;
    date: string;
    items: {
        name: string;
        nameAr?: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    subtotal: number;
    vatAmount: number;
    discount: number;
    total: number;
    paymentMethod: string;
    customerName?: string;
    qrCode?: string;
}

export const Receipt: React.FC<ReceiptProps> = ({
    storeName,
    vatin,
    invoiceNo,
    date,
    items,
    subtotal,
    vatAmount,
    discount,
    total,
    paymentMethod,
    customerName,
    qrCode
}) => {
    // Fallback if specialized TLV is not provided
    const qrValue = qrCode || JSON.stringify({
        seller: storeName,
        vat: vatin,
        timestamp: date,
        total: total.toFixed(3),
        tax: vatAmount.toFixed(3)
    });

    return (
        <div className="w-[80mm] bg-white p-4 text-black font-mono text-[11px] leading-tight mx-auto shadow-lg" id="thermal-receipt">
            {/* Header */}
            <div className="text-center space-y-1 mb-4">
                <h1 className="text-base font-bold uppercase">{storeName}</h1>
                <p>Tax Invoice / فاتورة ضريبية</p>
                <p>VATIN: {vatin}</p>
                <p className="text-[10px] mt-2">--------------------------------</p>
            </div>

            {/* Info */}
            <div className="space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Invoice:</span>
                    <span>{invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date / التاريخ:</span>
                    <span>{new Date(date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>System Admin</span>
                </div>
                {customerName && (
                    <div className="flex justify-between font-bold">
                        <span>Customer:</span>
                        <span>{customerName}</span>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-center mb-2">--------------------------------</p>

            {/* Items Table */}
            <table className="w-full text-left mb-4">
                <thead>
                    <tr className="border-b border-black/10">
                        <th className="py-1">Item / الصنف</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Price</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-1">
                                <div className="font-bold">{item.name}</div>
                                <div className="text-[9px] opacity-70">{item.nameAr || item.name}</div>
                            </td>
                            <td className="py-1 text-center">{item.quantity}</td>
                            <td className="py-1 text-right">{item.total.toFixed(3)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="text-[10px] text-center mb-2">--------------------------------</p>

            {/* Summary */}
            <div className="space-y-1.5 font-bold mb-6">
                <div className="flex justify-between">
                    <span>Subtotal / المجموع الفرعي:</span>
                    <span>OMR {subtotal.toFixed(3)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span>Discount / الخصم:</span>
                        <span>-OMR {discount.toFixed(3)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>VAT (5% Incl.) / ضريبة:</span>
                    <span>OMR {vatAmount.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-base border-t border-black pt-2">
                    <span>TOTAL / الإجمالي:</span>
                    <span>OMR {total.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-[10px] opacity-70">
                    <span>Payment / طريقة الدفع:</span>
                    <span>{paymentMethod}</span>
                </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center gap-2 mb-6">
                <div className="bg-white p-2 border border-black/10">
                    <QRCodeSVG value={qrValue} size={100} />
                </div>
                <p className="text-[9px] uppercase tracking-widest opacity-50">Fawtara Verified</p>
            </div>

            {/* Footer */}
            <div className="text-center space-y-1 text-[9px] opacity-70 italic">
                <p>Thank you for shopping with us!</p>
                <p>شكراً لزيارتكم!</p>
                <p className="mt-2 non-italic font-bold opacity-100">B-HUB Unified POS System</p>
            </div>
        </div>
    );
};
