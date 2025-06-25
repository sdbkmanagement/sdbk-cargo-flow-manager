import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginForm } from "@/components/auth/LoginForm";
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
import Administration from "./pages/Administration";

const queryClient = new QueryClient();

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <>{children}</>;
};

// Layout principal avec sidebar
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirection automatique vers l'authentification */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Routes protégées avec layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/fleet" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Fleet />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/drivers" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Drivers />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/missions" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Missions />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/cargo" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Cargo />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/billing" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Billing />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/validations" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Validations />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/rh" element={
                <ProtectedRoute>
                  <MainLayout>
                    <RH />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/administration" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Administration />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/guide" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Guide />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Route pour les pages non trouvées */}
              <Route path="*" element={
                <ProtectedRoute>
                  <MainLayout>
                    <NotFound />
                  </MainLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
