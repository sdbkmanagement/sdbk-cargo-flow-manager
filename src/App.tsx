
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Drivers from "@/pages/Drivers";
import Billing from "@/pages/Billing";
import Fleet from "@/pages/Fleet";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/fleet" element={
        <ProtectedRoute>
          <Fleet />
        </ProtectedRoute>
      } />
      <Route path="/drivers" element={
        <ProtectedRoute>
          <Drivers />
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute>
          <Billing />
        </ProtectedRoute>
      } />
      <Route path="/missions" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Planification des missions</h1>
            <p className="text-muted-foreground mt-2">Module en développement...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/validations" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Workflow de validation</h1>
            <p className="text-muted-foreground mt-2">Module en développement...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/cargo" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Suivi des chargements</h1>
            <p className="text-muted-foreground mt-2">Module en développement...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/hr" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Ressources Humaines</h1>
            <p className="text-muted-foreground mt-2">Module en développement...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-muted-foreground mt-2">Module en développement...</p>
          </div>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
