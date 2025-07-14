import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { ModernHeader } from '@/components/layout/ModernHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { PageLoader } from '@/components/ui/loading-states';
import { usePageVisibility } from '@/hooks/usePageVisibility';

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

// Configuration optimisée du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

// Layout principal avec gestion de la visibilité
const ModernAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isVisible, hasReturned } = usePageVisibility();
  const [forceRefresh, setForceRefresh] = useState(0);

  console.log('🔍 App state:', { user: !!user, loading, initialized, isVisible, hasReturned });

  // Force refresh when user returns to tab to fix UI degradation
  useEffect(() => {
    if (hasReturned && user) {
      console.log('🔄 Forcing UI refresh after tab return');
      setForceRefresh(prev => prev + 1);
      
      // Additional cleanup for potential style issues
      setTimeout(() => {
        // Force recalculation of sidebar state
        setSidebarCollapsed(prev => {
          const newState = !prev;
          setTimeout(() => setSidebarCollapsed(prev), 50);
          return newState;
        });
      }, 100);
    }
  }, [hasReturned, user]);

  // Afficher le loader seulement pendant l'initialisation
  if (!initialized) {
    return <PageLoader message="Initialisation..." />;
  }

  // Si pas d'utilisateur et qu'on ne charge pas, afficher la page de connexion
  if (!user && !loading) {
    console.log('📋 Showing login form - no user and not loading');
    return <LoginForm />;
  }

  // Si on charge ET qu'il n'y a pas d'utilisateur, afficher le loader de connexion
  if (loading && !user) {
    console.log('⏳ Loading user after authentication...');
    return <PageLoader message="Connexion en cours..." />;
  }

  // Si on a un utilisateur, afficher l'application
  if (user) {
    console.log('🏠 Showing main app for user:', user.email);
    return (
      <div key={forceRefresh} className="min-h-screen flex bg-background text-foreground">
        {/* Sidebar moderne responsive avec key pour forcer re-render */}
        <div className="hidden lg:block">
          <ModernSidebar 
            key={`sidebar-${forceRefresh}`}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Contenu principal avec key pour forcer re-render */}
        <div className="flex-1 flex flex-col min-w-0">
          <ModernHeader 
            key={`header-${forceRefresh}`}
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
  }

  // Fallback - ne devrait jamais arriver
  console.log('⚠️ Unexpected state, showing login form');
  return <LoginForm />;
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
