import React, { useState, useEffect } from 'react';

interface DashboardStats {
    todaySales: number;
    todayTransactions: number;
    lowStockItems: number;
    activeStaff: number;
    topProduct: string;
    peakHour: string;
}

export const ManagerDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        todaySales: 2450.750,
        todayTransactions: 87,
        lowStockItems: 12,
        activeStaff: 3,
        topProduct: 'Fresh Milk 1L',
        peakHour: '10:00 - 11:00',
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#121212] p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-[#121212]">B</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
                            <p className="text-gray-400 text-sm">لوحة تحكم المدير</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold text-lg">{currentTime.toLocaleTimeString('en-GB')}</p>
                        <p className="text-gray-400 text-sm">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Today's Sales */}
                <div className="bg-gradient-to-br from-[#28a745] to-[#20c997] rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-white text-sm opacity-90 mb-1">Today's Sales</p>
                    <p className="text-white text-3xl font-bold">OMR {stats.todaySales.toFixed(3)}</p>
                    <p className="text-white text-xs opacity-75 mt-2">+12.5% vs yesterday</p>
                </div>

                {/* Transactions */}
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-[#121212] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-[#121212] text-sm opacity-90 mb-1">Transactions</p>
                    <p className="text-[#121212] text-3xl font-bold">{stats.todayTransactions}</p>
                    <p className="text-[#121212] text-xs opacity-75 mt-2">Avg: OMR {(stats.todaySales / stats.todayTransactions).toFixed(3)}</p>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-white text-sm opacity-90 mb-1">Low Stock Items</p>
                    <p className="text-white text-3xl font-bold">{stats.lowStockItems}</p>
                    <p className="text-white text-xs opacity-75 mt-2">Requires attention</p>
                </div>

                {/* Active Staff */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-white text-sm opacity-90 mb-1">Active Staff</p>
                    <p className="text-white text-3xl font-bold">{stats.activeStaff}</p>
                    <p className="text-white text-xs opacity-75 mt-2">On shift now</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Sales Chart */}
                <div className="bg-[#1E1E1E] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-white font-bold text-lg mb-4">Hourly Sales Today</h3>
                    <div className="h-48 flex items-end justify-between space-x-2">
                        {[120, 180, 250, 320, 280, 380, 420, 390, 350, 280, 200, 150].map((value, i) => (
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
                    <h3 className="text-white font-bold text-lg mb-4">Top Selling Products</h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Fresh Milk 1L', sales: 45, revenue: 27.000 },
                            { name: 'White Bread', sales: 38, revenue: 17.100 },
                            { name: 'Water 1.5L', sales: 62, revenue: 9.300 },
                            { name: 'Eggs (30pcs)', sales: 18, revenue: 21.600 },
                        ].map((product, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center text-[#121212] font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{product.name}</p>
                                        <p className="text-gray-400 text-xs">{product.sales} units sold</p>
                                    </div>
                                </div>
                                <span className="text-[#28a745] font-bold">OMR {product.revenue.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-gray-800 rounded-xl p-6 transition group">
                    <svg className="w-8 h-8 text-[#D4AF37] mb-3 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-white font-medium">View Reports</p>
                    <p className="text-gray-400 text-xs mt-1">التقارير</p>
                </button>

                <button className="bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-gray-800 rounded-xl p-6 transition group">
                    <svg className="w-8 h-8 text-[#D4AF37] mb-3 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-white font-medium">Inventory</p>
                    <p className="text-gray-400 text-xs mt-1">المخزون</p>
                </button>

                <button className="bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-gray-800 rounded-xl p-6 transition group">
                    <svg className="w-8 h-8 text-[#D4AF37] mb-3 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-white font-medium">Staff</p>
                    <p className="text-gray-400 text-xs mt-1">الموظفين</p>
                </button>

                <button className="bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-gray-800 rounded-xl p-6 transition group">
                    <svg className="w-8 h-8 text-[#D4AF37] mb-3 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-white font-medium">Settings</p>
                    <p className="text-gray-400 text-xs mt-1">الإعدادات</p>
                </button>
            </div>
        </div>
    );
};
