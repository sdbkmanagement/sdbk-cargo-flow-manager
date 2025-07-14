
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
import { Loader2, Building2, Calendar, Clock, Wifi } from "lucide-react";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { user, loading } = useAuth();

  console.log('AppLayout - User:', user, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sdbk-blue via-blue-700 to-blue-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-sdbk-green rounded-2xl flex items-center justify-center shadow-sdbk-green animate-bounce-subtle">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-white absolute -top-2 -right-2 bg-sdbk-red rounded-full p-1" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">SDBK Cargo Flow Manager</h2>
            <p className="text-blue-200 font-medium">Système de gestion intégré</p>
            <div className="w-64 bg-blue-700/30 rounded-full h-3 mx-auto overflow-hidden">
              <div className="bg-sdbk-green h-3 rounded-full animate-pulse transition-all duration-1000" style={{ width: '75%' }}></div>
            </div>
            <p className="text-xs text-blue-300">Initialisation en cours...</p>
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-soft border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-sdbk-green rounded-full animate-pulse shadow-sdbk-green" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    SDBK Transport Manager
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Tableau de bord opérationnel
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-sdbk-green" />
                  <span>Connecté</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-sdbk-blue" />
                  <span>
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date().toLocaleTimeString('fr-FR', { 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  Bienvenue, {user.email}
                </p>
                <p className="text-xs text-gray-500">
                  Dernière connexion aujourd'hui
                </p>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto bg-gray-50">
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
