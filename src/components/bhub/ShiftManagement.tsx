import React, { useState } from 'react';
import { Shift, User, Store } from '@/types/bhub';

interface ShiftManagementProps {
    user: User;
    store: Store;
    onShiftStarted: (shift: Shift) => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({ user, store, onShiftStarted }) => {
    const [openingCash, setOpeningCash] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleStartShift = async () => {
        setIsLoading(true);
        try {
            const shift: Shift = {
                id: `shift_${Date.now()}`,
                storeId: store.id,
                userId: user.id,
                startTime: new Date(),
                openingCash: parseFloat(openingCash) || 0,
                status: 'active',
            };

            // TODO: Save to backend
            await new Promise(resolve => setTimeout(resolve, 500));

            onShiftStarted(shift);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl p-8 border border-gray-800">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4AF37] rounded-xl mb-4">
                            <svg className="w-8 h-8 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Start New Shift</h2>
                        <p className="text-gray-400">بدء وردية جديدة</p>
                    </div>

                    {/* User Info */}
                    <div className="bg-[#2A2A2A] rounded-lg p-4 mb-6 border border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400">Cashier</p>
                                <p className="text-white font-medium">{user.fullName}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Store</p>
                                <p className="text-white font-medium">{store.name}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-400">Time</p>
                                <p className="text-white font-medium">{new Date().toLocaleString('en-GB', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Opening Cash */}
                    <div className="mb-6">
                        <label htmlFor="openingCash" className="block text-sm font-medium text-gray-300 mb-2">
                            Opening Cash Amount (OMR) / النقد الافتتاحي
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">OMR</span>
                            <input
                                id="openingCash"
                                type="number"
                                step="0.001"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                                className="w-full pl-16 pr-4 py-4 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white text-xl font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                                placeholder="0.000"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Count the cash in your drawer before starting</p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        {[50, 100, 200, 500].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setOpeningCash(amount.toString())}
                                className="py-2 px-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-gray-700 rounded-lg text-white text-sm font-medium transition"
                            >
                                {amount}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleStartShift}
                            disabled={isLoading || !openingCash}
                            className="w-full bg-gradient-to-r from-[#28a745] to-[#20c997] text-white font-bold py-4 px-6 rounded-lg hover:from-[#20c997] hover:to-[#28a745] focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isLoading ? 'Starting Shift...' : 'START SHIFT / بدء الوردية'}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-transparent border border-gray-700 text-gray-300 font-medium py-3 px-6 rounded-lg hover:bg-[#2A2A2A] transition"
                        >
                            Logout / تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
