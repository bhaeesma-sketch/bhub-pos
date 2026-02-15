import React, { useState, useEffect } from 'react';
import { offlineDb } from '@/lib/offlineDb';
import { Customer } from '@/types/bhub';

interface KhatTransaction {
    id: string;
    date: Date;
    amount: number;
    type: 'credit' | 'payment';
    ref: string;
}

interface KhatAccount {
    phone: string;
    name: string;
    balance: number;
    lastTransaction: Date;
    history: KhatTransaction[];
}

export const KhatLedger: React.FC = () => {
    const [searchPhone, setSearchPhone] = useState('');
    const [selectedKhat, setSelectedKhat] = useState<KhatAccount | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [khatList, setKhatList] = useState<KhatAccount[]>([]);

    useEffect(() => {
        loadKhats();
    }, []);

    const loadKhats = async () => {
        setLoading(true);
        try {
            // In a real app, paginate this or search. For now, fetch all local khats.
            const allKhats = await offlineDb.getAllKhats();
            // Sort by balance (highest debt first)
            setKhatList(allKhats.sort((a, b) => b.balance - a.balance));
        } catch (error) {
            console.error('Failed to load Khat ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchPhone) return;
        setLoading(true);
        try {
            const khat = await offlineDb.getKhat(searchPhone);
            if (khat) {
                setSelectedKhat(khat);
            } else {
                // Look up customer to start new khat?
                // For now, strict ledger search.
                alert('No Khat account found for this number.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedKhat || !paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Invalid amount');
            return;
        }

        try {
            // Add payment (negative credit)
            // We implement a 'addPayment' to DB logic similar to 'addCredit' but with type 'payment'
            // Re-using addCredit logic but with negative amount?
            // Better to have explicit types.
            // Let's assume offlineDb has a wrapper or we do it manually here for simplicity/speed

            const newTransaction: KhatTransaction = {
                id: `PAY-${Date.now()}`,
                date: new Date(),
                amount: -amount,
                type: 'payment',
                ref: 'MANUAL-PAYMENT'
            };

            const updatedKhat = {
                ...selectedKhat,
                balance: selectedKhat.balance - amount,
                lastTransaction: new Date(),
                history: [...selectedKhat.history, newTransaction]
            };

            // Update IndexedDB
            await offlineDb.saveKhat(updatedKhat); // We need to add saveKhat to offlineDb interface helper

            setSelectedKhat(updatedKhat);
            setPaymentAmount('');
            loadKhats(); // Refresh list
            alert('Payment Recorded!');

        } catch (error) {
            console.error(error);
            alert('Failed to record payment');
        }
    };

    return (
        <div className="flex h-full bg-[#121212] text-white">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-800 p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-[#D4AF37]">Active Khat Accounts</h2>
                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Search Phone..."
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        className="w-full bg-[#1E1E1E] border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                    >
                        🔍
                    </button>
                </div>

                <div className="space-y-2">
                    {khatList.map(khat => (
                        <div
                            key={khat.phone}
                            onClick={() => setSelectedKhat(khat)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedKhat?.phone === khat.phone ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-[#1E1E1E] hover:bg-[#2A2A2A]'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{khat.name}</span>
                                <span className={`font-bold ${khat.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {khat.balance.toFixed(3)} OMR
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{khat.phone}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 p-8">
                {selectedKhat ? (
                    <div className="bg-[#1E1E1E] rounded-xl p-8 border border-gray-800 h-full flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{selectedKhat.name}</h1>
                                <p className="text-gray-400 text-lg">{selectedKhat.phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                                <p className={`text-4xl font-bold ${selectedKhat.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {selectedKhat.balance.toFixed(3)} <span className="text-lg text-gray-500">OMR</span>
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-[#2A2A2A] p-4 rounded-lg">
                                <label className="block text-sm text-gray-400 mb-2">Settle Debt (Payment)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="flex-1 bg-[#121212] border border-gray-700 rounded px-3 py-2"
                                        placeholder="Amount"
                                    />
                                    <button
                                        onClick={handlePayment}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                                    >
                                        Pay
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#2A2A2A] p-4 rounded-lg opacity-50 cursor-not-allowed">
                                <label className="block text-sm text-gray-400 mb-2">Add New Credit</label>
                                <p className="text-xs text-gray-500">To add credit, start a New Sale from POS and select 'Payment Method: Khat'</p>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="flex-1 overflow-auto">
                            <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">History</h3>
                            <table className="w-full text-left">
                                <thead className="text-gray-500 text-sm">
                                    <tr>
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">Details</th>
                                        <th className="pb-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {selectedKhat.history.slice().reverse().map(tx => (
                                        <tr key={tx.id} className="text-sm">
                                            <td className="py-3 text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="py-3">{tx.ref}</td>
                                            <td className={`py-3 text-right font-medium ${tx.type === 'payment' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.type === 'payment' ? '-' : '+'}{Math.abs(tx.amount).toFixed(3)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a customer to view ledger
                    </div>
                )}
            </div>
        </div>
    );
};
