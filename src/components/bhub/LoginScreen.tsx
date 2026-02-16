import React, { useState } from 'react';
import { Smartphone, UserCircle, Lock, Building2, Crown, Sparkles } from 'lucide-react';
import { Store, User } from '@/types/bhub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginScreenProps {
    onLoginSuccess: (user: User, store: Store) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [storeId, setStoreId] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberStore, setRememberStore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    // Load remembered store on mount
    React.useEffect(() => {
        const remembered = localStorage.getItem('bhub_remembered_store');
        if (remembered) {
            setStoreId(remembered);
            setRememberStore(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Simulated authentication
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (!storeId || !username || !password) {
                throw new Error('All fields are required');
            }

            if (password.length < 4) {
                throw new Error('Invalid credentials');
            }

            if (rememberStore) {
                localStorage.setItem('bhub_remembered_store', storeId);
            } else {
                localStorage.removeItem('bhub_remembered_store');
            }

            const isOwner = username.toLowerCase().includes('owner') ||
                username.toLowerCase().includes('admin') ||
                username.toLowerCase() === storeId.toLowerCase() ||
                username.toLowerCase() === (localStorage.getItem('bhub_admin_username') || '').toLowerCase();

            const role = isOwner ? 'admin' : 'cashier';

            const user: User = {
                id: isOwner ? 'owner_1' : `staff_${Date.now()}`,
                username,
                storeId,
                role: role as 'cashier' | 'manager' | 'admin',
                fullName: isOwner ? 'Store Owner' : 'Store Cashier',
            };

            const store: Store = {
                id: storeId,
                name: storeId.toUpperCase() + ' Grocery',
                location: 'Muscat, Oman',
                taxNumber: 'OM1234567890',
            };

            localStorage.setItem('bhub_auth_token', `${storeId}_${username}_${Date.now()}`);
            onLoginSuccess(user, store);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-gold/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                {/* Logo and Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
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
                    <p className="text-muted-foreground font-medium mt-1">Cloud Retail Operations • Smart & Unified</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="h-[1px] w-8 bg-border" />
                        <span className="text-[10px] text-primary font-bold uppercase tracking-widest">نظام البيع السحابي الموحد</span>
                        <div className="h-[1px] w-8 bg-border" />
                    </div>
                </div>

                {/* Login Form */}
                <div className="glass-card rounded-[2.5rem] p-10 glow-cyan relative overflow-hidden group">
                    {/* Decorative shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-5 text-left">
                            {/* Store ID */}
                            <div className="space-y-2">
                                <Label htmlFor="storeId" className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
                                    <span>Store ID / معرف المتجر</span>
                                    <Building2 className="w-3 h-3" />
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="storeId"
                                        className="h-14 rounded-2xl glass border-border/40 focus:ring-primary/30 text-base font-semibold transition-all px-4"
                                        placeholder="Enter Store ID"
                                        value={storeId}
                                        onChange={e => setStoreId(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
                                    <span>Username / اسم المستخدم</span>
                                    <UserCircle className="w-3 h-3" />
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        className="h-14 rounded-2xl glass border-border/40 focus:ring-primary/30 text-base font-semibold transition-all px-4"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
                                    <span>Password / كلمة المرور</span>
                                    <Lock className="w-3 h-3" />
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-14 rounded-2xl glass border-border/40 focus:ring-primary/30 text-base font-semibold transition-all px-4 tracking-widest"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs font-bold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 rounded-2xl gradient-cyan text-white font-black text-lg transition-all active:scale-95 glow-cyan-strong flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>LOG IN / دخول</span>
                                    <Crown className="w-5 h-5 text-gold group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Action Links */}
                    <div className="mt-8 pt-8 border-t border-border/30 text-center space-y-4">
                        <button
                            onClick={() => {
                                localStorage.removeItem('bhub_onboarding_complete');
                                window.location.reload();
                            }}
                            className="text-primary hover:text-primary/70 text-xs font-black tracking-widest uppercase transition-colors"
                        >
                            New Merchant? Launch Your Store
                        </button>

                        <div className="opacity-40 flex flex-col items-center gap-1">
                            <p className="text-[10px] font-bold tracking-tight">POWERED BY B-HUB RETAIL CLOUD • OMAN</p>
                            <p className="text-[9px] font-mono">v3.0.0-CONNECTED</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
