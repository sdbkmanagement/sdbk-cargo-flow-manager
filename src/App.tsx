
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import Index from "./pages/Index";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Missions from "./pages/Missions";
import Cargo from "./pages/Cargo";
import Billing from "./pages/Billing";
import Validations from "./pages/Validations";
import RH from "./pages/RH";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex h-screen bg-gray-100">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="p-6">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/fleet" element={<Fleet />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/missions" element={<Missions />} />
                    <Route path="/cargo" element={<Cargo />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/validations" element={<Validations />} />
                    <Route path="/rh" element={<RH />} />
                    <Route path="/guide" element={<Guide />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
