import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StaffProvider } from "./contexts/StaffContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import { OnboardingFlow } from "./components/bhub/OnboardingFlow";
import { LoginScreen } from "./components/bhub/LoginScreen";
import { useStaffSession } from "./contexts/StaffContext";
import { useState } from "react";
import { KhatLedger } from "./components/bhub/KhatLedger";
import { OwnerRemoteDashboard } from "./components/bhub/OwnerRemoteDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRouter = () => {
  const { staffSession, setStaffSession } = useStaffSession();
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('bhub_onboarding_complete') === 'true'
  );

  if (!onboardingComplete) {
    return <OnboardingFlow onComplete={() => setOnboardingComplete(true)} />;
  }

  if (!staffSession) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setStaffSession({
            id: user.id,
            name: user.fullName,
            role: user.role === 'admin' ? 'owner' : 'staff',
          });
        }}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Integrated Cloud Features */}
        <Route path="/bhub/khat" element={<KhatLedger />} />
        <Route path="/bhub/owner/:storeId" element={<OwnerRemoteDashboard storeId="STORE001" />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
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
);

export default App;
