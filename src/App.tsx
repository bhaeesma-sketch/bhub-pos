import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StaffProvider } from "./contexts/StaffContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Purchases from "./pages/Purchases";
import SettingsPage from "./pages/SettingsPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import { OnboardingFlow } from "./components/bhub/OnboardingFlow";
import { LoginScreen } from "./components/bhub/LoginScreen";
import { useStaffSession } from "./contexts/StaffContext";
import { useState } from "react";
import { KhatLedger } from "./components/bhub/KhatLedger";
import { OwnerRemoteDashboard } from "./components/bhub/OwnerRemoteDashboard";
import Audit from "./pages/Audit";
import NotFound from "./pages/NotFound";
import MasterControl from "./pages/MasterControl";

import { useStoreConfig } from "./hooks/useSupabaseData";
import { useEffect } from "react";

const queryClient = new QueryClient();

import { WaitingForActivation } from "./components/bhub/WaitingForActivation";
import { isJabalShamsMaster } from "./lib/subscription";

import { SplashLoader } from "./components/layout/SplashLoader";

const RootRouter = () => {
  const { staffSession, setStaffSession } = useStaffSession();
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('bhub_onboarding_complete') === 'true'
  );

  // Load store config globally
  const { data: storeConfig, isLoading: configLoading } = useStoreConfig();

  useEffect(() => {
    if (storeConfig) {
      // Use bracket notation to bypass temporal type mismatch
      console.log('Store Config Loaded:', (storeConfig as any)['store_name']);
    }
  }, [storeConfig]);

  if (configLoading) {
    return <SplashLoader />;
  }

  if (storeConfig?.subscription_status === 'blocked' && !isJabalShamsMaster(storeConfig.store_name)) {
    return <WaitingForActivation />;
  }

  if (!onboardingComplete) {
    return <OnboardingFlow onComplete={() => setOnboardingComplete(true)} />;
  }

  if (!staffSession) {
    return (
      <LoginScreen
        onStartOnboarding={() => setOnboardingComplete(false)}
        onLoginSuccess={(user, store) => {
          setStaffSession({
            id: user.id,
            name: user.fullName,
            role: user.role === 'admin' ? 'owner' : 'staff',
          });
          if (store) {
            localStorage.setItem('bhub_current_store', JSON.stringify(store));
          }
        }}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/audit" element={<Audit />} />

        {/* Integrated Cloud Features */}
        <Route path="/bhub" element={<Navigate to="/bhub/khat" replace />} />
        <Route path="/bhub/khat" element={<KhatLedger />} />
        <Route path="/bhub/owner/:storeId" element={<OwnerRemoteDashboard storeId="STORE001" />} />

        {/* Master Control Panel - Hidden Route */}
        <Route path="/master-control" element={<MasterControl />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import { GlobalErrorBoundary } from "./components/layout/GlobalErrorBoundary";

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StaffProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RootRouter />
          </BrowserRouter>
        </StaffProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
