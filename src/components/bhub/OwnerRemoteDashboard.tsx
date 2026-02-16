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
        return <div className="p-8 text-center animate-pulse">Loading Live Data...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Remote Monitoring</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Updates for {storeId} • Last updated: {lastUpdate.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-medium"
                        >
                            Inventory Import
                        </button>
                        <button
                            onClick={loadDashboardData}
                            className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
                            title="Refresh Data"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                {dashboardData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Today's Revenue", value: `${dashboardData.todaySales.toFixed(3)} OMR`, icon: "💰", color: "text-green-600" },
                            { label: "Transactions", value: dashboardData.todayTransactions, icon: "🧾", color: "text-blue-600" },
                            { label: "Active Cashiers", value: dashboardData.activeCashiers, icon: "👤", color: "text-purple-600" },
                            { label: "Low Stock Items", value: dashboardData.lowStockAlerts, icon: "⚠️", color: "text-destructive" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                                <div className="text-3xl bg-secondary w-12 h-12 flex items-center justify-center rounded-xl">{stat.icon}</div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold mb-4 text-foreground">Hourly Sales Activity</h3>
                            <div className="flex-1 flex items-end gap-1 px-2">
                                {dashboardData?.hourlySales.map((val, i) => (
                                    <div
                                        key={i}
                                        className="bg-primary/40 hover:bg-primary/60 transition-all rounded-t w-full relative group"
                                        style={{ height: `${Math.max((val / (Math.max(...(dashboardData?.hourlySales || [1])) || 1)) * 100, 5)}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                                            {val.toFixed(2)} OMR
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] text-muted-foreground px-1 uppercase font-medium">
                                <span>8am</span><span>12pm</span><span>4pm</span><span>8pm</span><span>12am</span>
                            </div>
                        </div>

                        {/* Recent Feed */}
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="text-lg font-bold mb-4 text-foreground">Recent Sales Feed</h3>
                            <div className="space-y-3">
                                {dashboardData?.recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center text-xs">✓</div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Bill #{sale.id.slice(-6).toUpperCase()}</p>
                                                <p className="text-[10px] text-muted-foreground">{sale.time} • {sale.cashier}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-600">{sale.total.toFixed(3)} OMR</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-4 text-primary">Top Performing Products</h3>
                        <div className="space-y-4">
                            {dashboardData?.topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-foreground">{p.name}</span>
                                            <span className="text-muted-foreground">{p.quantity} sold</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${(p.revenue / (dashboardData.topProducts[0].revenue || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest">
                            View Detailed Report
                        </button>
                    </div>
                </div>
            </div>

            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </div>
    );
};
