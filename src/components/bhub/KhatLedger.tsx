import React, { useState, useEffect } from 'react';
import { offlineDb } from '@/lib/offlineDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Receipt, MessageCircle, CheckCircle2, Search, ArrowLeft, History } from 'lucide-react';
import { toast } from 'sonner';

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
    const [searchQuery, setSearchQuery] = useState('');
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
            const allKhats = await offlineDb.getAllKhats();
            setKhatList(allKhats.sort((a, b) => b.balance - a.balance));
        } catch (error) {
            console.error('Failed to load Khat ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (amountToPay?: number) => {
        if (!selectedKhat) return;

        const amount = amountToPay ?? parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const newTransaction: KhatTransaction = {
                id: `PAY-${Date.now()}`,
                date: new Date(),
                amount: -amount,
                type: 'payment',
                ref: 'CASH PAYMENT'
            };

            const updatedKhat = {
                ...selectedKhat,
                balance: selectedKhat.balance - amount,
                lastTransaction: new Date(),
                history: [...selectedKhat.history, newTransaction]
            };

            await offlineDb.saveKhat(updatedKhat);
            setSelectedKhat(updatedKhat);
            setPaymentAmount('');
            loadKhats();
            toast.success(`Payment of OMR ${amount.toFixed(3)} recorded for ${selectedKhat.name}`);
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    const sendWhatsAppReminder = () => {
        if (!selectedKhat) return;
        const message = `Hi ${selectedKhat.name}, this is a friendly reminder from your store. Your outstanding balance in our Khat ledger is OMR ${selectedKhat.balance.toFixed(3)}. Thank you!`;
        const url = `https://wa.me/${selectedKhat.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        toast.info('Opening WhatsApp...');
    };

    const filteredKhats = khatList.filter(k =>
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.phone.includes(searchQuery)
    );

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar: Accounts List */}
            <div className="w-80 md:w-96 border-r border-border flex flex-col bg-muted/10">
                <div className="p-6 border-b border-border space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Khat Ledger</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name or phone..."
                            className="pl-10 h-11"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 pos-scrollbar">
                    {filteredKhats.map(khat => (
                        <button
                            key={khat.phone}
                            onClick={() => setSelectedKhat(khat)}
                            className={`w-full p-4 rounded-xl text-left transition-all ${selectedKhat?.phone === khat.phone
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-[0.98]'
                                    : 'hover:bg-muted'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold truncate">{khat.name}</span>
                                <span className={`text-xs font-mono font-bold ${selectedKhat?.phone === khat.phone ? 'text-primary-foreground' : 'text-destructive'
                                    }`}>
                                    OMR {khat.balance.toFixed(3)}
                                </span>
                            </div>
                            <div className={`text-[10px] opacity-70 flex items-center gap-1`}>
                                <Smartphone className="w-3 h-3" /> {khat.phone}
                            </div>
                        </button>
                    ))}
                    {filteredKhats.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <p>No active accounts found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Detail & Actions */}
            <div className="flex-1 overflow-y-auto">
                {selectedKhat ? (
                    <div className="max-w-4xl mx-auto p-8 space-y-8">
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest font-bold">Total Balance / الرصيد</p>
                                <h2 className="text-5xl font-black text-destructive tracking-tighter">
                                    {selectedKhat.balance.toFixed(3)} <span className="text-xl">OMR</span>
                                </h2>
                                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-foreground text-lg">{selectedKhat.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedKhat.phone}</p>
                                    </div>
                                    <Button size="icon" variant="outline" className="rounded-full" onClick={sendWhatsAppReminder}>
                                        <MessageCircle className="w-5 h-5 text-success" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-success/5 border border-success/20 rounded-2xl p-6">
                                    <h3 className="font-bold text-success-foreground mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" /> Settle Debt / سداد الدين
                                    </h3>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">OMR</span>
                                            <Input
                                                type="number"
                                                className="pl-12 h-12 text-lg font-bold"
                                                placeholder="0.000"
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="h-12 bg-success hover:bg-success/90 text-success-foreground font-bold px-6"
                                            onClick={() => handlePayment()}
                                        >
                                            Pay
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-8 bg-background shadow-none border-success/30 text-success"
                                            onClick={() => handlePayment(selectedKhat.balance)}
                                        >
                                            Settle Full Amount
                                        </Button>
                                    </div>
                                </div>
                                <Button className="w-full h-12 bg-success/20 text-success hover:bg-success/30 border-0 flex items-center gap-2" onClick={sendWhatsAppReminder}>
                                    <MessageCircle className="w-4 h-4" /> Send WhatsApp Reminder
                                </Button>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                    Transaction History / سجل المعاملات
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedKhat.history.slice().reverse().map(tx => (
                                            <tr key={tx.id} className="text-sm hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                                    {new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${tx.type === 'payment' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{tx.ref}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'payment' ? 'text-success' : 'text-destructive'
                                                    }`}>
                                                    {tx.type === 'payment' ? '-' : '+'}{Math.abs(tx.amount).toFixed(3)} OMR
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Receipt className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">No Account Selected</h2>
                        <p className="text-muted-foreground max-w-xs">Select a customer from the left sidebar to view their digital ledger and manage debts.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
