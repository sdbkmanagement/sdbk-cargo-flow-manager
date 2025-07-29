
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useRealtimeData } from "./hooks/useRealtimeData";
import { useAutoSync } from "./hooks/useAutoSync";
import { initializeSync } from "./services/initSync";
import { useEffect } from "react";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Missions from "./pages/Missions";
import Billing from "./pages/Billing";
import RH from "./pages/RH";
import Administration from "./pages/Administration";
import Validations from "./pages/Validations";
import NotFound from "./pages/NotFound";
import { ModernDashboard } from "./components/layout/ModernDashboard";

const queryClient = new QueryClient();

function AppContent() {
  useRealtimeData();
  useAutoSync(); // Activer la synchronisation automatique

  // Initialize sync after React and QueryClient are ready
  useEffect(() => {
    const runInitSync = async () => {
      // Small delay to ensure everything is properly initialized
      setTimeout(() => {
        initializeSync();
      }, 1000);
    };
    
    runInitSync();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ModernDashboard />}>
        <Route index element={<Dashboard />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="missions" element={<Missions />} />
        <Route path="billing" element={<Billing />} />
        <Route path="rh" element={<RH />} />
        <Route path="administration" element={<Administration />} />
        <Route path="validations" element={<Validations />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
