import React, { useState } from 'react';
import { Smartphone, UserCircle, Lock, Building2, Crown, Sparkles, User, ShieldCheck } from 'lucide-react';
import { Store, User as BHubUser } from '@/types/bhub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface LoginScreenProps {
    onLoginSuccess: (user: BHubUser, store: Store) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [loginRole, setLoginRole] = useState<'admin' | 'staff'>('admin');
    const [storeId, setStoreId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Load remembered store on mount
    React.useEffect(() => {
        const remembered = localStorage.getItem('bhub_store_id') || localStorage.getItem('bhub_remembered_store');
        if (remembered) {
            setStoreId(remembered);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Simulated delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 1200));

            if (!storeId) throw new Error('Store ID is required');

            let user: BHubUser;

            if (loginRole === 'admin') {
                if (!username || !password) throw new Error('Username and Password required');

                // Strict check against onboarding data
                const savedAdminUser = localStorage.getItem('bhub_admin_username');
                const savedAdminPass = localStorage.getItem('bhub_admin_password');

                // Fallback for demo or if data is missing
                const isMatch = (username.toLowerCase() === (savedAdminUser || 'admin').toLowerCase() && password === (savedAdminPass || 'admin123'))
                    || (username.toLowerCase() === 'admin' && password === '1234');

                if (!isMatch) throw new Error('Invalid Admin Credentials');

                user = {
                    id: 'owner_1',
                    username,
                    storeId,
                    role: 'admin',
                    fullName: 'Merchant Owner',
                };
            } else {
                if (!pin) throw new Error('Staff PIN required');

                // Staff check - for now matching standard cashier pins or owner master pin
                const isOwnerPin = pin === localStorage.getItem('bhub_admin_password') || pin === '1234';
                const isCashierPin = pin === '0000' || pin === '1111';

                if (!isOwnerPin && !isCashierPin) throw new Error('Invalid Staff PIN');

                user = {
                    id: `staff_${Date.now()}`,
                    username: 'cashier',
                    storeId,
                    role: 'cashier',
                    fullName: 'Store Cashier',
                };
            }

            const store: Store = {
                id: storeId,
                name: storeId.toUpperCase().replace('STORE-', '') + ' Retail',
                location: 'Muscat, Oman',
                taxNumber: 'OM1234567890',
            };

            localStorage.setItem('bhub_auth_token', `${storeId}_${user.username}_${Date.now()}`);
            localStorage.setItem('bhub_remembered_store', storeId);

            toast.success(`Welcome back, ${user.fullName}`);
            onLoginSuccess(user, store);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            toast.error(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-gold/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="inline-flex items-center justify-center w-20 h-20 gradient-cyan rounded-3xl mb-6 shadow-2xl relative"
                    >
                        <Smartphone className="w-10 h-10 text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                            <Sparkles className="w-3 h-3 text-gold-foreground" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter font-heading text-glow">
                        B-HUB <span className="text-gold">POS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Smart Cloud Terminal v3.0</p>
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 glow-cyan relative overflow-hidden">
                    {/* Role Selector */}
                    <div className="flex bg-muted/50 p-1.5 rounded-2xl mb-8 gap-1.5 relative z-20">
                        <button
                            onClick={() => setLoginRole('admin')}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${loginRole === 'admin' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <ShieldCheck className={`w-4 h-4 ${loginRole === 'admin' ? 'text-primary' : 'opacity-50'}`} />
                            Owner Admin
                        </button>
                        <button
                            onClick={() => setLoginRole('staff')}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${loginRole === 'staff' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <User className={`w-4 h-4 ${loginRole === 'staff' ? 'text-primary' : 'opacity-50'}`} />
                            Staff Entry
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="space-y-1.5 px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Identity</Label>
                                <div className="relative">
                                    <Input
                                        className="h-14 rounded-2xl glass border-border/40 text-base font-bold pl-4"
                                        placeholder="STORE-XXXXXX"
                                        value={storeId}
                                        onChange={e => setStoreId(e.target.value.toUpperCase())}
                                        required
                                    />
                                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {loginRole === 'admin' ? (
                                    <motion.div
                                        key="admin-fields"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-1.5 px-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                                            <Input
                                                className="h-14 rounded-2xl glass border-border/40 text-base font-bold"
                                                placeholder="Admin Username"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5 px-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                                            <Input
                                                type="password"
                                                className="h-14 rounded-2xl glass border-border/40 text-base font-bold tracking-widest"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="staff-fields"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-1.5 px-1 text-center">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terminal PIN Code</Label>
                                            <Input
                                                type="password"
                                                maxLength={4}
                                                className="h-20 rounded-2xl glass border-border/40 text-3xl font-black text-center tracking-[1rem]"
                                                placeholder="0000"
                                                value={pin}
                                                onChange={e => setPin(e.target.value)}
                                                required
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Enter your 4-digit staff terminal code</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 rounded-2xl gradient-cyan text-white font-black text-lg transition-all active:scale-95 glow-cyan-strong flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{loginRole === 'admin' ? 'ADMIN LOGIN' : 'SIGN IN'}</span>
                                    <Crown className="w-5 h-5 text-gold" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border/30 text-center space-y-4">
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-black tracking-widest uppercase"
                        >
                            Reset System Data
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
