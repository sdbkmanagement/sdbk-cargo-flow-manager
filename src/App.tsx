
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecureAuthProvider } from "@/contexts/SecureAuthContext";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import Dashboard from "@/pages/Dashboard";
import Fleet from "@/pages/Fleet";
import Drivers from "@/pages/Drivers";
import Missions from "@/pages/Missions";
import Billing from "@/pages/Billing";
import Administration from "@/pages/Administration";
import RH from "@/pages/RH";
import Validations from "@/pages/Validations";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SecureAuthProvider>
            <BrowserRouter>
              <Toaster />
              <Routes>
                <Route path="/" element={<ResponsiveLayout><Outlet /></ResponsiveLayout>}>
                  <Route index element={<Dashboard />} />
                  <Route path="fleet" element={<Fleet />} />
                  <Route path="drivers" element={<Drivers />} />
                  <Route path="missions" element={<Missions />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="administration" element={<Administration />} />
                  <Route path="rh" element={<RH />} />
                  <Route path="validations" element={<Validations />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SecureAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
