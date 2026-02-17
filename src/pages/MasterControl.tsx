import { useState, useEffect } from 'react';
import { Shield, Check, X, Clock, AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isJabalShamsMaster, MASTER_STORE_NAME } from '@/lib/subscription';
import type { Tables } from '@/integrations/supabase/types';

type StoreConfig = Tables<'store_config'>;

export default function MasterControlPanel() {
    const [stores, setStores] = useState<StoreConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const isMaster = isJabalShamsMaster();

    useEffect(() => {
        if (!isMaster) {
            toast.error('Access Denied: Master Account Only');
            return;
        }
        fetchStores();
    }, [isMaster]);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('store_config')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStores(data || []);
        } catch (err: any) {
            toast.error('Failed to load stores: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateSubscriptionStatus = async (storeId: string, newStatus: 'trial' | 'active' | 'blocked') => {
        setUpdating(storeId);
        try {
            const { error } = await supabase
                .from('store_config')
                .update({
                    subscription_status: newStatus,
                    expires_at: newStatus === 'active' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', storeId);

            if (error) throw error;
            toast.success(`Status updated to: ${newStatus.toUpperCase()}`);
            fetchStores();
        } catch (err: any) {
            toast.error('Update failed: ' + err.message);
        } finally {
            setUpdating(null);
        }
    };

    if (!isMaster) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="glass-card rounded-2xl p-8 text-center space-y-4 max-w-md">
                    <Shield className="w-16 h-16 mx-auto text-destructive" />
                    <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                    <p className="text-sm text-muted-foreground">
                        This panel is restricted to <span className="text-gold font-bold">{MASTER_STORE_NAME}</span> only.
                    </p>
                </div>
            </div>
        );
    }

    const filteredStores = stores.filter(store =>
        store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.vat_number?.includes(searchQuery)
    );

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6 border-2 border-gold/30 shadow-[0_0_30px_-5px_hsl(var(--gold)/0.3)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                            <Crown className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Agency Portal</h1>
                            <p className="text-xs text-muted-foreground font-medium">
                                {MASTER_STORE_NAME} — Master Control
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search Clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-primary/20 rounded-xl px-4 py-2 text-sm focus:outline-primary w-64"
                        />
                        <button
                            onClick={fetchStores}
                            disabled={loading}
                            className="p-3 rounded-xl glass border border-primary/20 text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{stores.length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Stores</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-success">{stores.filter(s => s.subscription_status === 'active').length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-warning">{stores.filter(s => s.subscription_status === 'trial').length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Trial</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-destructive">{stores.filter(s => s.subscription_status === 'blocked').length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Blocked</p>
                </div>
            </div>

            {/* Stores Table */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">Registered Clients</h2>

                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground mt-2">Loading stores...</p>
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-12">
                        <Shield className="w-12 h-12 mx-auto text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground mt-2">No matching clients found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Client Name</th>
                                    <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase text-xs">VAT / CR</th>
                                    <th className="text-left py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Device ID</th>
                                    <th className="text-right py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Revenue</th>
                                    <th className="text-center py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Status</th>
                                    <th className="text-center py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Expires</th>
                                    <th className="text-center py-3 px-2 font-bold text-muted-foreground uppercase text-xs">Master Switch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStores.map((store) => {
                                    const isMasterStore = store.store_name === MASTER_STORE_NAME;
                                    const expiresAt = store.expires_at ? new Date(store.expires_at) : null;
                                    const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                                    return (
                                        <motion.tr
                                            key={store.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    {isMasterStore && <Crown className="w-4 h-4 text-gold" />}
                                                    <span className={cn("font-medium", isMasterStore && "text-gold")}>{store.store_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                                                {store.vat_number || '—'}
                                            </td>
                                            <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                                                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                                    {store.id.substring(0, 8).toUpperCase()}...
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-mono text-xs">
                                                OMR 0.00
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                    store.subscription_status === 'active' && "bg-success/20 text-success",
                                                    store.subscription_status === 'trial' && "bg-warning/20 text-warning",
                                                    store.subscription_status === 'blocked' && "bg-destructive/20 text-destructive"
                                                )}>
                                                    {store.subscription_status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center text-xs text-muted-foreground">
                                                {isMasterStore ? (
                                                    <span className="text-gold font-bold">∞ Lifetime</span>
                                                ) : expiresAt ? (
                                                    <span className={cn(daysLeft && daysLeft < 3 && "text-destructive font-bold")}>
                                                        {daysLeft !== null && daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="py-3 px-2">
                                                {isMasterStore ? (
                                                    <div className="flex justify-center">
                                                        <span className="text-xs text-gold font-bold">MASTER</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            onClick={() => updateSubscriptionStatus(store.id, 'active')}
                                                            disabled={updating === store.id || store.subscription_status === 'active'}
                                                            className={cn(
                                                                "p-1.5 rounded-lg transition-all",
                                                                store.subscription_status === 'active'
                                                                    ? "bg-success/20 text-success cursor-default"
                                                                    : "bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
                                                            )}
                                                            title="Activate"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateSubscriptionStatus(store.id, 'trial')}
                                                            disabled={updating === store.id || store.subscription_status === 'trial'}
                                                            className={cn(
                                                                "p-1.5 rounded-lg transition-all",
                                                                store.subscription_status === 'trial'
                                                                    ? "bg-warning/20 text-warning cursor-default"
                                                                    : "bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-50"
                                                            )}
                                                            title="Set to Trial"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateSubscriptionStatus(store.id, 'blocked')}
                                                            disabled={updating === store.id || store.subscription_status === 'blocked'}
                                                            className={cn(
                                                                "p-1.5 rounded-lg transition-all",
                                                                store.subscription_status === 'blocked'
                                                                    ? "bg-destructive/20 text-destructive cursor-default"
                                                                    : "bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                                                            )}
                                                            title="Block"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
