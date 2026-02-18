import React, { useState, useEffect } from 'react';
import { Smartphone, Sparkles, Building2, UserCircle2, ArrowRight, ShieldCheck, LogIn, Store as StoreIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PinLogin, { type StaffSession } from '@/components/pos/PinLogin';
import { Store, User as BHubUser } from '@/types/bhub';

interface LoginScreenProps {
    onLoginSuccess: (user: BHubUser, store: Store) => void;
    onStartOnboarding: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onStartOnboarding }) => {
    const [view, setView] = useState<'splash' | 'store-id' | 'pin-pad'>('splash');
    const [storeId, setStoreId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Persistent Store ID Logic
    useEffect(() => {
        const savedStore = localStorage.getItem('bhub_store_id');
        if (savedStore) {
            setStoreId(savedStore);
            // If we have a saved store, skip splash and go to pin-pad directly for daily use
            setView('pin-pad');
        }
    }, []);

    const handleStoreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId.trim()) {
            toast.error('Please enter your Store Name/ID');
            return;
        }
        localStorage.setItem('bhub_store_id', storeId.trim());
        setView('pin-pad');
    };

    const handlePinLogin = (session: StaffSession) => {
        const user: BHubUser = {
            id: session.id,
            username: session.name.toLowerCase().replace(/\s+/g, '_'),
            storeId: storeId,
            role: session.role === 'owner' ? 'admin' : 'cashier',
            fullName: session.name,
        };

        const store: Store = {
            id: storeId,
            name: localStorage.getItem('bhub_store_name') || storeId.toUpperCase(),
            location: 'Muscat, Oman',
            taxNumber: localStorage.getItem('bhub_vat_number') || '',
        };

        onLoginSuccess(user, store);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dark Luxury Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-gold/10 rounded-full blur-[150px]" />
            </div>

            <AnimatePresence mode="wait">
                {view === 'splash' && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="w-full max-w-sm text-center z-10 space-y-12"
                    >
                        <div className="space-y-6">
                            <motion.div
                                animate={{ rotateY: [0, 360] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="inline-flex items-center justify-center w-24 h-24 gradient-cyan rounded-[2.5rem] shadow-2xl relative"
                            >
                                <Smartphone className="w-12 h-12 text-white" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                                    <Sparkles className="w-4 h-4 text-gold-foreground" />
                                </div>
                            </motion.div>
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black text-foreground tracking-tighter font-heading text-glow">
                                    JABALSHAMS <span className="text-gold">POS</span>
                                </h1>
                                <p className="text-muted-foreground font-medium tracking-widest uppercase text-[10px]">Professional Cloud Terminal</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <Button
                                onClick={() => setView('store-id')}
                                className="h-16 rounded-2xl bg-primary text-white font-black text-lg glow-cyan-strong flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                STAFF LOGIN
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onStartOnboarding}
                                className="h-16 rounded-2xl border-primary/30 glass text-foreground font-black text-lg hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <StoreIcon className="w-5 h-5 text-gold" />
                                REGISTER MY STORE
                            </Button>
                        </div>

                        <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.3em]">
                            Enterprise Retail OS v3.2
                        </p>
                    </motion.div>
                )}

                {view === 'store-id' && (
                    <motion.div
                        key="store-id"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full max-w-md z-10"
                    >
                        <div className="glass-card rounded-[2.5rem] p-10 glow-cyan relative overflow-hidden">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black font-heading text-foreground">Welcome Back</h2>
                                <p className="text-xs text-muted-foreground">Enter your store identifier to continue</p>
                            </div>

                            <form onSubmit={handleStoreSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Name/ID</Label>
                                    <div className="relative">
                                        <Input
                                            autoFocus
                                            className="h-16 rounded-2xl glass border-border/40 text-lg font-bold placeholder:opacity-30 pl-12"
                                            placeholder="e.g. bhaees-grocery"
                                            value={storeId}
                                            onChange={e => setStoreId(e.target.value.toLowerCase())}
                                        />
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-16 rounded-2xl gradient-cyan text-white font-black text-lg glow-cyan-strong flex items-center justify-center gap-2"
                                >
                                    CONTINUE <ArrowRight className="w-5 h-5" />
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setView('splash')}
                                    className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground opacity-50"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {view === 'pin-pad' && (
                    <motion.div
                        key="pin-pad"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm z-10"
                    >
                        <div className="mb-6 flex items-center justify-center gap-4">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                            <div className="px-4 py-1.5 rounded-full glass border border-primary/20 flex items-center gap-2">
                                <StoreIcon className="w-3.5 h-3.5 text-gold" />
                                <span className="text-[10px] font-black uppercase text-foreground">{localStorage.getItem('bhub_store_name') || storeId}</span>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
                        </div>

                        <div className="relative">
                            <PinLogin onLogin={handlePinLogin} />

                            <button
                                onClick={() => {
                                    localStorage.removeItem('bhub_store_id');
                                    setView('splash');
                                }}
                                className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70"
                            >
                                Switch Store Identity
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
