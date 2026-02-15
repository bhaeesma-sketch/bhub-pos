import React, { useState, useEffect } from 'react';
import { cloudSync } from '@/lib/bhub-cloud-sync';
import { BulkImportModal } from './BulkImportModal';

interface OwnerDashboardProps {
    storeId: string;
}

interface DashboardData {
    todaySales: number;
    todayTransactions: number;
    activeCashiers: number;
    lowStockAlerts: number;
    topProducts: Array<{ name: string; revenue: number; quantity: number }>;
    hourlySales: number[];
    recentSales: Array<{ id: string; total: number; time: string; cashier: string }>;
}

export const OwnerRemoteDashboard: React.FC<OwnerDashboardProps> = ({ storeId }) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadDashboardData();
        }, 30000);

        return () => clearInterval(interval);
    }, [storeId]);

    const loadDashboardData = async () => {
        try {
            const data = await cloudSync.getDashboardStats(storeId);
            if (data) {
                setDashboardData(data);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] p-4 sm:p-6">
            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    alert('Import Successful!');
                    loadDashboardData(); // Refresh stats
                }}
            />

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Owner Dashboard</h1>
                        <p className="text-gray-400">لوحة تحكم المالك - Remote Monitoring / {storeId}</p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right flex flex-col sm:items-end gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#FFD700] text-black font-bold rounded-lg text-sm shadow-lg transform hover:scale-105 transition"
                            >
                                📥 Bulk CSV Import
                            </button>
                            <a href="/bhub/khat" className="px-4 py-2 bg-[#1E1E1E] border border-gray-700 hover:bg-[#3A3A3A] text-white rounded-lg text-sm">
                                📝 Khat Ledger
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Last: {lastUpdate.toLocaleTimeString()}</span>
                            <button
                                onClick={loadDashboardData}
                                className="px-3 py-1 bg-[#D4AF37] hover:bg-[#FFD700] text-[#121212] rounded font-medium text-xs"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-[#28a745] to-[#20c997] rounded-xl p-6 shadow-lg min-h-[120px]">
                    <p className="text-white text-sm opacity-90 mb-1">Today's Revenue</p>
                    <p className="text-white text-3xl sm:text-4xl font-bold">
                        OMR {dashboardData?.todaySales.toFixed(3) || '0.000'}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl p-6 shadow-lg min-h-[120px]">
                    <p className="text-[#121212] text-sm opacity-90 mb-1">Transactions</p>
                    <p className="text-[#121212] text-3xl sm:text-4xl font-bold">
                        {dashboardData?.todayTransactions || 0}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 shadow-lg min-h-[120px]">
                    <p className="text-white text-sm opacity-90 mb-1">Active Cashiers</p>
                    <p className="text-white text-3xl sm:text-4xl font-bold">
                        {dashboardData?.activeCashiers || 0}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 shadow-lg min-h-[120px]">
                    <p className="text-white text-sm opacity-90 mb-1">Low Stock Alerts</p>
                    <p className="text-white text-3xl sm:text-4xl font-bold">
                        {dashboardData?.lowStockAlerts || 0}
                    </p>
                </div>
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Hourly Sales */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-white font-bold text-lg mb-4">Hourly Sales</h3>
                    <div className="h-48 flex items-end justify-between space-x-2">
                        {(dashboardData?.hourlySales || [120, 180, 250, 320, 280, 380, 420, 390, 350, 280, 200, 150]).map((value, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-[#D4AF37] to-[#FFD700] rounded-t-lg transition-all hover:opacity-80"
                                    style={{ height: `${(value / 420) * 100}%` }}
                                />
                                <span className="text-gray-500 text-xs mt-2">{i + 8}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-white font-bold text-lg mb-4">Top Products</h3>
                    <div className="space-y-3">
                        {(dashboardData?.topProducts || [
                            { name: 'Fresh Milk 1L', revenue: 27.000, quantity: 45 },
                            { name: 'White Bread', revenue: 17.100, quantity: 38 },
                            { name: 'Water 1.5L', revenue: 9.300, quantity: 62 },
                        ]).map((product, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center text-[#121212] font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{product.name}</p>
                                        <p className="text-gray-400 text-xs">{product.quantity} units</p>
                                    </div>
                                </div>
                                <span className="text-[#28a745] font-bold">OMR {product.revenue.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
                <h3 className="text-white font-bold text-lg mb-4">Recent Sales (Live)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="pb-3 text-gray-400 font-medium text-sm">Receipt #</th>
                                <th className="pb-3 text-gray-400 font-medium text-sm">Time</th>
                                <th className="pb-3 text-gray-400 font-medium text-sm">Cashier</th>
                                <th className="pb-3 text-gray-400 font-medium text-sm text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(dashboardData?.recentSales || [
                                { id: 'RCP-001', time: '14:35', cashier: 'Ahmed', total: 12.450 },
                                { id: 'RCP-002', time: '14:32', cashier: 'Fatima', total: 8.750 },
                                { id: 'RCP-003', time: '14:28', cashier: 'Ahmed', total: 15.200 },
                            ]).map((sale) => (
                                <tr key={sale.id} className="border-b border-gray-800 hover:bg-[#2A2A2A] transition">
                                    <td className="py-3 text-white font-mono text-sm">{sale.id}</td>
                                    <td className="py-3 text-gray-300 text-sm">{sale.time}</td>
                                    <td className="py-3 text-gray-300 text-sm">{sale.cashier}</td>
                                    <td className="py-3 text-[#28a745] font-bold text-right">OMR {sale.total.toFixed(3)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
