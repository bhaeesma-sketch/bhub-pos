import React, { useState, useEffect } from 'react';
import { OnboardingFlow } from '@/components/bhub/OnboardingFlow';
import { LoginScreen } from '@/components/bhub/LoginScreen';
import { ShiftManagement } from '@/components/bhub/ShiftManagement';
import { BHubPOS } from '@/components/bhub/BHubPOS';
import { User, Store, Shift } from '@/types/bhub';

type AppState = 'onboarding' | 'login' | 'shift-management' | 'pos';

export default function BHubApp() {
    const [appState, setAppState] = useState<AppState>('onboarding');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentStore, setCurrentStore] = useState<Store | null>(null);
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);

    // Check if onboarding is complete
    useEffect(() => {
        const onboardingComplete = localStorage.getItem('bhub_onboarding_complete');
        if (onboardingComplete === 'true') {
            setAppState('login');
        }
    }, []);

    const handleOnboardingComplete = (config: any, adminPassword: string) => {
        console.log('✅ Onboarding complete:', config);
        console.log('🔐 Admin password set (hashed in production)');
        setAppState('login');
    };

    const handleLoginSuccess = (user: User, store: Store) => {
        setCurrentUser(user);
        setCurrentStore(store);

        // Check for active shift (mock check)
        const hasActiveShift = false; // TODO: Check backend for active shift

        if (hasActiveShift) {
            // Load active shift and go directly to POS
            setAppState('pos');
        } else {
            // Go to shift management
            setAppState('shift-management');
        }
    };

    const handleShiftStarted = (shift: Shift) => {
        setCurrentShift(shift);
        setAppState('pos');
    };

    return (
        <div className="min-h-screen">
            {appState === 'onboarding' && (
                <OnboardingFlow onComplete={handleOnboardingComplete} />
            )}

            {appState === 'login' && (
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}

            {appState === 'shift-management' && currentUser && currentStore && (
                <ShiftManagement
                    user={currentUser}
                    store={currentStore}
                    onShiftStarted={handleShiftStarted}
                />
            )}

            {appState === 'pos' && currentUser && currentStore && currentShift && (
                <BHubPOS
                    user={currentUser}
                    store={currentStore}
                    shift={currentShift}
                />
            )}
        </div>
    );
}
