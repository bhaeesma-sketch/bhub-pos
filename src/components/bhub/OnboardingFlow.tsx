import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Mail, Phone, Lock, Building2, MapPin, Hash, Receipt, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingProps {
    onComplete: (config: any, adminPassword: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '+968 ',
        password: '1234', // Default PIN for Dukkantek style
    });

    const [storeData, setStoreData] = useState({
        storeName: '',
        legalName: '',
        crNumber: '',
        location: '',
        currency: 'OMR',
    });

    const [vatData, setVatData] = useState({
        isVatEnabled: true,
        vatin: '',
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else finalizeOnboarding();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const finalizeOnboarding = async () => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const storeId = storeData.storeName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 4);

            const config = {
                ...storeData,
                ...vatData,
                ownerName: userData.name,
                storeId,
            };

            // 1. Create Store Config in Supabase
            const { error: configError } = await (supabase.from('store_config' as any) as any).upsert({
                store_name: storeData.storeName,
                vat_number: vatData.isVatEnabled ? vatData.vatin : null,
                address: storeData.legalName + (storeData.location ? ` | ${storeData.location}` : ''),
                currency: 'OMR',
                subscription_status: 'blocked'
            });

            if (configError) console.error('Store config error:', configError);

            localStorage.setItem('bhub_store_config', JSON.stringify(config));
            localStorage.setItem('bhub_onboarding_complete', 'true');
            localStorage.setItem('bhub_store_name', storeData.storeName);
            localStorage.setItem('bhub_vat_number', vatData.vatin);
            localStorage.setItem('bhub_store_id', storeId);
            localStorage.setItem('bhub_admin_password', userData.password);
            localStorage.setItem('bhub_admin_username', userData.name);

            // 2. Seed the staff table with the owner record
            const { error: staffError } = await supabase.from('staff').insert({
                name: userData.name,
                pin: userData.password,
                role: 'owner',
                is_active: true
            });

            if (staffError) {
                console.error('Supabase staff insert error:', staffError);
                toast.warning('Offline Mode Active. Cloud sync pending.');
            } else {
                toast.success(`Business Registered: ${storeData.storeName}`, {
                    description: `Owner PIN is ${userData.password}. Store ID saved.`,
                });
            }

            onComplete(config, userData.password);
        } catch (error: any) {
            console.error('Onboarding finalize error:', error);
            toast.error('Registration failed: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[5%] right-[5%] w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[5%] w-80 h-80 bg-gold/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-md w-full z-10">
                {/* Branding */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="inline-flex items-center justify-center w-20 h-20 gradient-cyan rounded-[2rem] mb-6 shadow-2xl relative"
                    >
                        <Smartphone className="w-10 h-10 text-white" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1"
                        >
                            <Sparkles className="w-5 h-5 text-gold" />
                        </motion.div>
                    </motion.div>
                    <h1 className="text-3xl font-black text-foreground font-heading tracking-tighter">JABALSHAMS <span className="text-gold">POS</span></h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Deploy your cloud retail system in seconds</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-between mb-8 gap-3">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1 space-y-2">
                            <div
                                className={`h-1.5 w-full rounded-full transition-all duration-500 ${s <= step ? 'gradient-cyan shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-muted'
                                    }`}
                            />
                            <p className={`text-[9px] font-black uppercase tracking-widest text-center ${s <= step ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                                Step 0{s}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="glass-card rounded-[2.5rem] p-10 glow-cyan relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black font-heading text-foreground flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        </div>
                                        Owner Registry
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium">Verify your administrative identity</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Full Name</Label>
                                        <div className="relative">
                                            <Input
                                                id="name"
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                                placeholder="e.g. Ahmed Bin Said"
                                                value={userData.name}
                                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">WhatsApp Number</Label>
                                        <div className="relative">
                                            <Input
                                                id="phone"
                                                type="tel"
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                                placeholder="+968 9000 0000"
                                                value={userData.phone}
                                                onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">4-Digit Master PIN</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={4}
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold tracking-widest text-center text-lg"
                                                placeholder="••••"
                                                value={userData.password}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                                    setUserData({ ...userData, password: val });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl gradient-cyan text-white font-black text-base shadow-xl active:scale-95 transition-transform"
                                    onClick={handleNext}
                                    disabled={!userData.name || !userData.password || !userData.phone}
                                >
                                    Proceed to Identity <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black font-heading text-foreground flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        Store Identity
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium">Configure your Omani retail footprint</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="storeName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Legal Store Name</Label>
                                        <Input
                                            id="storeName"
                                            className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                            placeholder="e.g. Al-Fayha Supermarket"
                                            value={storeData.storeName}
                                            onChange={e => setStoreData({ ...storeData, storeName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="location" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Google Maps Location Link</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="location"
                                                className="h-12 rounded-xl glass border-border/40 pl-10 pr-4 font-semibold"
                                                placeholder="https://maps.app.goo.gl/..."
                                                value={storeData.location}
                                                onChange={e => setStoreData({ ...storeData, location: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="crNumber" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">CR Number</Label>
                                            <Input
                                                id="crNumber"
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                                placeholder="123456"
                                                value={storeData.crNumber}
                                                onChange={e => setStoreData({ ...storeData, crNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="legalName" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Legal Entity / Address</Label>
                                            <Input
                                                id="legalName"
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                                placeholder="LLC / Sole Prop."
                                                value={storeData.legalName}
                                                onChange={e => setStoreData({ ...storeData, legalName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Functional Currency</Label>
                                        <div className="h-12 rounded-xl glass border-border/40 px-4 flex items-center justify-between opacity-80">
                                            <span className="text-base font-bold text-foreground">OMR - Omani Rial</span>
                                            <Globe className="w-4 h-4 text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={handleBack}>
                                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button
                                        className="flex-[2] h-14 rounded-2xl gradient-cyan text-white font-black text-base shadow-xl active:scale-95 transition-transform"
                                        onClick={handleNext}
                                        disabled={!storeData.storeName || !storeData.crNumber}
                                    >
                                        Next: Compliance
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black font-heading text-foreground flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Receipt className="w-5 h-5 text-primary" />
                                        </div>
                                        Compliance
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium">Omani Tax Authority protocol</p>
                                </div>

                                <div className="glass rounded-[1.5rem] p-6 space-y-5 border border-primary/20 bg-primary/5">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-black text-foreground">ENABLE 5% VAT</Label>
                                            <p className="text-[10px] text-muted-foreground font-medium">Standard Omani Protocol</p>
                                        </div>
                                        <Switch
                                            checked={vatData.isVatEnabled}
                                            onCheckedChange={v => setVatData({ ...vatData, isVatEnabled: v })}
                                        />
                                    </div>

                                    {vatData.isVatEnabled && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-2 pt-4 border-t border-primary/10"
                                        >
                                            <Label htmlFor="vatin" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">VATIN (VAT Registration)</Label>
                                            <Input
                                                id="vatin"
                                                className="h-12 rounded-xl glass border-border/40 px-4 font-semibold"
                                                placeholder="OM123456789"
                                                value={vatData.vatin}
                                                onChange={e => setVatData({ ...vatData, vatin: e.target.value })}
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="bg-info/10 p-4 rounded-xl flex gap-3 items-start border border-info/20">
                                    <Sparkles className="w-5 h-5 text-info mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-info-foreground font-bold leading-relaxed px-1">
                                        <strong>Fawtara Ready:</strong> Your receipts will automatically generate OTA-compliant QR codes and bilingual tax labels.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={handleBack}>
                                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                                    </Button>
                                    <Button
                                        className="flex-[2] h-14 rounded-2xl bg-success text-white font-black text-base shadow-xl active:scale-95 transition-transform group"
                                        onClick={handleNext}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>DEPLOYING...</span>
                                            </div>
                                        ) : (
                                            <>LAUNCH BUSINESS <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="flex items-center justify-center gap-3 mt-10"
                >
                    <div className="h-[1px] w-4 bg-muted-foreground" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        SaaS PROV BY B-HUB RETAIL CLOUD
                    </p>
                    <div className="h-[1px] w-4 bg-muted-foreground" />
                </motion.div>
            </div>
        </div>
    );
};
