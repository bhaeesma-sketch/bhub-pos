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
import BHubApp from "./pages/BHub";
import { ManagerDashboard } from "./components/bhub/ManagerDashboard";
import { OwnerRemoteDashboard } from "./components/bhub/OwnerRemoteDashboard";
import { InventoryManager } from "./components/bhub/InventoryManager";
import { KhatLedger } from "./components/bhub/KhatLedger";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StaffProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* B-HUB Grocery POS - Standalone Routes */}
            <Route path="/bhub" element={<BHubApp />} />
            <Route path="/bhub/manager" element={<ManagerDashboard />} />
            <Route path="/bhub/owner/:storeId" element={<OwnerRemoteDashboard storeId={window.location.pathname.split('/').pop() || 'STORE001'} />} />
            <Route path="/bhub/inventory" element={<InventoryManager />} />
            <Route path="/bhub/khat" element={<KhatLedger />} />

            {/* Original Dukkantek Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StaffProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
