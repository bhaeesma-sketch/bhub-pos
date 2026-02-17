import { ShieldAlert, Phone, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const WaitingForActivation = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-6 glow-warning border-2 border-warning/20"
            >
                <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-warning/5">
                    <ShieldAlert className="w-10 h-10 text-warning animate-pulse" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black font-heading text-foreground uppercase tracking-tight">
                        Account Pending Approval
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Your store instance has been created and locked for security.
                        Please contact your <span className="text-gold font-bold">Jabalshams Agent</span> for activation.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-4 text-left border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            Support Hotline
                        </p>
                        <p className="text-sm font-bold text-foreground font-mono">
                            +968 9000 0000
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                        Your Device ID: <span className="font-mono text-foreground font-bold">{localStorage.getItem('bhub_store_id')?.substring(0, 12).toUpperCase() || 'UNKNOWN'}...</span>
                    </p>
                </div>

                <button
                    onClick={() => {
                        const pin = prompt('Enter Master Admin PIN to Force Activate:');
                        if (pin === '9999' || pin === '3009') { // 3009 is original Jabalshams PIN
                            import('@/integrations/supabase/client').then(async ({ supabase }) => {
                                // Try to activate
                                const { error } = await supabase
                                    .from('store_config')
                                    .update({ subscription_status: 'active' })
                                    .eq('store_name', localStorage.getItem('bhub_store_name'));

                                if (!error) {
                                    alert('Store Activated Successfully! Reloading...');
                                    window.location.reload();
                                } else {
                                    alert('Activation Failed: ' + error.message);
                                }
                            });
                        } else if (pin) {
                            alert('Invalid PIN');
                        }
                    }}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                    ⚡ Admin Force Activate
                </button>

                <button
                    onClick={() => {
                        if (confirm('Reset Device? This will clear local data.')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Reset / Register New Store
                </button>
            </motion.div>
        </div>
    );
};
