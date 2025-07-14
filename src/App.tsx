
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { ModernHeader } from '@/components/layout/ModernHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { PageLoader } from '@/components/ui/loading-states';

// Lazy loading optimisé pour de meilleures performances
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Fleet = lazy(() => import('@/pages/Fleet'));
const Drivers = lazy(() => import('@/pages/Drivers'));
const Missions = lazy(() => import('@/pages/Missions'));
const Cargo = lazy(() => import('@/pages/Cargo'));
const Billing = lazy(() => import('@/pages/Billing'));
const RH = lazy(() => import('@/pages/RH'));
const Validations = lazy(() => import('@/pages/Validations'));
const Administration = lazy(() => import('@/pages/Administration'));
const DocumentStock = lazy(() => import('@/pages/DocumentStock'));
const Guide = lazy(() => import('@/pages/Guide'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Configuration optimisée du QueryClient avec cache intelligent
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Pas de retry pour les erreurs d'authentification
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      // Optimisation réseau
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

// Layout principal moderne et optimisé
const ModernAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Optimisation: État de chargement immédiat sans délai
  if (!initialized || loading) {
    return <PageLoader message="Chargement de l'application..." />;
  }

  // Redirection vers login si non authentifié
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar moderne responsive */}
      <div className="hidden lg:block">
        <ModernSidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <ModernHeader 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          showMenuButton={true}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="page-container">
            <Suspense fallback={<PageLoader message="Chargement du module..." />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ModernAppLayout>
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
          </ModernAppLayout>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
