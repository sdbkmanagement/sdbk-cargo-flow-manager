
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { LoginForm } from "@/components/auth/LoginForm";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Missions from "./pages/Missions";
import Cargo from "./pages/Cargo";
import Billing from "./pages/Billing";
import RH from "./pages/RH";
import Validations from "./pages/Validations";
import Administration from "./pages/Administration";
import DocumentStock from "./pages/DocumentStock";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";
import { Loader2, Zap } from "lucide-react";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { user, loading } = useAuth();

  console.log('AppLayout - User:', user, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue via-blue-700 to-blue-800">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center shadow-brand-glow animate-pulse">
              <Zap className="h-8 w-8 text-brand-darkText" />
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-white absolute -top-1 -right-1" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">SDBK Transport Manager</h2>
            <p className="text-blue-200">Chargement en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, showing login form');
    return <LoginForm />;
  }

  console.log('User authenticated, showing app layout');

  return (
    <div className="min-h-screen bg-brand-lightGrey flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-soft border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h1 className="text-xl font-semibold text-brand-darkText">
                  SDBK Transport Manager
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-brand-secondaryText">
                <span>•</span>
                <span>Système opérationnel</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-brand-darkText">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
                <p className="text-xs text-brand-secondaryText">
                  {new Date().toLocaleTimeString('fr-FR', { 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/cargo" element={<Cargo />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/rh" element={<RH />} />
            <Route path="/validations" element={<Validations />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/documents" element={<DocumentStock />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout />
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
