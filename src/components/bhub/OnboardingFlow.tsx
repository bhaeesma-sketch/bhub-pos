import React, { useState } from 'react';

interface StoreConfig {
    storeName: string;
    ownerName: string;
    crNumber: string;
    vatNumber: string;
    logoUrl?: string;
}

interface OnboardingProps {
    onComplete: (config: StoreConfig, adminPassword: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [storeConfig, setStoreConfig] = useState<StoreConfig>({
        storeName: 'B-HUB Grocery',
        ownerName: 'BHAEES',
        crNumber: '',
        vatNumber: '',
    });
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleComplete = () => {
        if (adminPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        if (adminPassword.length < 8) {
            alert('Password must be at least 8 characters!');
            return;
        }

        // Save configuration
        const finalConfig = {
            ...storeConfig,
            logoUrl: logoPreview,
        };

        localStorage.setItem('bhub_store_config', JSON.stringify(finalConfig));
        localStorage.setItem('bhub_onboarding_complete', 'true');
        localStorage.setItem('bhub_admin_username', adminUsername);

        onComplete(finalConfig, adminPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-2 mx-1 rounded-full transition-all ${s <= step ? 'bg-[#D4AF37]' : 'bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-gray-400 text-center text-sm">
                        Step {step} of 3
                    </p>
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="bg-[#1E1E1E] rounded-2xl p-12 border border-gray-800 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-3xl mb-6">
                            <span className="text-6xl font-bold text-[#121212]">B</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Welcome to B-HUB POS
                        </h1>
                        <p className="text-xl text-gray-300 mb-2">
                            Professional Grocery Point of Sale
                        </p>
                        <p className="text-lg text-[#D4AF37] mb-8">
                            نظام نقاط البيع الاحترافي للبقالة
                        </p>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Let's set up your store in 3 simple steps. This will only take 2 minutes.
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="px-12 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#121212] font-bold text-lg rounded-xl hover:from-[#FFD700] hover:to-[#D4AF37] transition-all shadow-lg"
                        >
                            Initialize My Store
                        </button>
                    </div>
                )}

                {/* Step 2: Store Configuration */}
                {step === 2 && (
                    <div className="bg-[#1E1E1E] rounded-2xl p-8 border border-gray-800">
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">
                            Store Configuration
                        </h2>
                        <p className="text-gray-400 text-center mb-8">
                            This information will appear on all your receipts
                        </p>

                        <div className="space-y-6">
                            {/* Store Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Store Name / اسم المتجر
                                </label>
                                <input
                                    type="text"
                                    value={storeConfig.storeName}
                                    onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="e.g., B-HUB Grocery"
                                />
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Owner Name / اسم المالك
                                </label>
                                <input
                                    type="text"
                                    value={storeConfig.ownerName}
                                    onChange={(e) => setStoreConfig({ ...storeConfig, ownerName: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="e.g., BHAEES"
                                />
                            </div>

                            {/* CR Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Commercial Registration (CR) Number
                                </label>
                                <input
                                    type="text"
                                    value={storeConfig.crNumber}
                                    onChange={(e) => setStoreConfig({ ...storeConfig, crNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="e.g., 1234567"
                                />
                            </div>

                            {/* VAT Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    VAT Number (VATIN) / الرقم الضريبي
                                </label>
                                <input
                                    type="text"
                                    value={storeConfig.vatNumber}
                                    onChange={(e) => setStoreConfig({ ...storeConfig, vatNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="e.g., OM1234567890"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Store Logo (Optional)
                                </label>
                                <div className="flex items-center space-x-4">
                                    {logoPreview && (
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-16 h-16 rounded-lg object-cover border-2 border-[#D4AF37]"
                                        />
                                    )}
                                    <label className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-gray-400 cursor-pointer hover:bg-[#3A3A3A] transition">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        {logoFile ? logoFile.name : 'Choose logo image...'}
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Recommended: Square image, 512x512px, PNG format
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!storeConfig.storeName || !storeConfig.ownerName}
                                className="flex-1 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#121212] font-bold rounded-lg hover:from-[#FFD700] hover:to-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Security Setup */}
                {step === 3 && (
                    <div className="bg-[#1E1E1E] rounded-2xl p-8 border border-gray-800">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 border border-red-500 rounded-xl mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                Security Setup
                            </h2>
                            <p className="text-gray-400">
                                Set your Master Admin Password
                            </p>
                        </div>

                        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
                            <p className="text-yellow-400 text-sm">
                                ⚠️ <strong>Important:</strong> This password gives full access to your business data, including remote monitoring, price changes, and customer ledger management. Keep it secure!
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Admin Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Admin Username
                                </label>
                                <input
                                    type="text"
                                    value={adminUsername}
                                    onChange={(e) => setAdminUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="e.g., owner or admin"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use "owner" or "admin" for automatic admin role detection
                                </p>
                            </div>

                            {/* Admin Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Master Password
                                </label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="Minimum 8 characters"
                                />
                                <div className="mt-2 space-y-1">
                                    <div className={`text-xs ${adminPassword.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                                        ✓ At least 8 characters
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                    placeholder="Re-enter password"
                                />
                                {confirmPassword && (
                                    <p className={`text-xs mt-1 ${adminPassword === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                                        {adminPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#2A2A2A] rounded-lg p-4 mt-6">
                            <h3 className="text-white font-medium mb-2">Account Types:</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>🔑 <strong className="text-[#D4AF37]">Owner Account:</strong> Full access - Remote monitoring, price changes, Khat management</li>
                                <li>👤 <strong className="text-gray-300">Staff Account:</strong> Restricted - POS only, no price changes, no Khat deletion</li>
                            </ul>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={!adminUsername || adminPassword.length < 8 || adminPassword !== confirmPassword}
                                className="flex-1 py-3 bg-gradient-to-r from-[#28a745] to-[#20c997] text-white font-bold rounded-lg hover:from-[#20c997] hover:to-[#28a745] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                Complete Setup
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
