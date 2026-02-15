import React, { useState } from 'react';
import { Store, User } from '@/types/bhub';

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
            // TODO: Replace with actual API call
            // Simulating authentication
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock validation
            if (!storeId || !username || !password) {
                throw new Error('All fields are required');
            }

            if (password.length < 6) {
                throw new Error('Invalid credentials');
            }

            // Save remembered store
            if (rememberStore) {
                localStorage.setItem('bhub_remembered_store', storeId);
            } else {
                localStorage.removeItem('bhub_remembered_store');
            }

            // ✅ ROLE DETECTION: Owner vs Staff
            const isOwner = username.toLowerCase().includes('owner') ||
                username.toLowerCase().includes('admin') ||
                username.toLowerCase() === storeId.toLowerCase();

            const role = isOwner ? 'admin' : 'cashier';

            // Mock user and store data
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

            // Save auth token for cloud sync
            localStorage.setItem('bhub_auth_token', `${storeId}_${username}_${Date.now()}`);

            onLoginSuccess(user, store);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-2xl mb-4">
                        <span className="text-4xl font-bold text-[#121212]">B</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">B-HUB POS</h1>
                    <p className="text-gray-400">Grocery Cloud System</p>
                    <p className="text-[#D4AF37] text-sm mt-1">نظام نقاط البيع السحابي</p>
                </div>

                {/* Login Form */}
                <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl p-8 border border-gray-800">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Store ID */}
                        <div>
                            <label htmlFor="storeId" className="block text-sm font-medium text-gray-300 mb-2">
                                Store ID / معرف المتجر
                            </label>
                            <input
                                id="storeId"
                                type="text"
                                value={storeId}
                                onChange={(e) => setStoreId(e.target.value)}
                                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                                placeholder="Enter store ID"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username / اسم المستخدم
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password / كلمة المرور
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {/* Remember Store */}
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberStore}
                                onChange={(e) => setRememberStore(e.target.checked)}
                                className="w-4 h-4 text-[#D4AF37] bg-[#2A2A2A] border-gray-700 rounded focus:ring-[#D4AF37] focus:ring-2"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                                Remember this store / تذكر هذا المتجر
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#121212] font-bold py-4 px-6 rounded-lg hover:from-[#FFD700] hover:to-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                'LOGIN / تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-xs text-gray-500">
                        <p>Powered by B-HUB Cloud • Version 2.0</p>
                        <p className="mt-1">For support: support@bhub.om</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
