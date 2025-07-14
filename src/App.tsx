
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { ModernHeader } from '@/components/layout/ModernHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { PageLoader } from '@/components/ui/loading-states';

// Lazy loading des pages
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  console.log('🔍 État de l\'app:', { 
    user: !!user, 
    userEmail: user?.email,
    loading 
  });

  // Affichage du chargement pendant l'initialisation - limité dans le temps
  if (loading) {
    console.log('⏳ Chargement initial...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <PageLoader message="Chargement..." />
      </div>
    );
  }

  // Si pas d'utilisateur connecté, afficher la page de connexion
  if (!user) {
    console.log('📋 Affichage du formulaire de connexion');
    return <LoginForm />;
  }

  // Si utilisateur connecté, afficher l'application
  console.log('🏠 Affichage de l\'application pour:', user.email);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <ModernSidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div 
          className={`min-h-screen transition-all duration-300 ease-out ${
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}
        >
          <ModernHeader 
            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            showMenuButton={true}
          />
          
          <main className="flex-1">
            <div className="page-container">
              <Suspense fallback={<PageLoader message="Chargement du module..." />}>
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
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </BrowserRouter>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
