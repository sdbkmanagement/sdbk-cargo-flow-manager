
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { ModernHeader } from '@/components/layout/ModernHeader';
import { LoginForm } from '@/components/auth/LoginForm';
import { PageLoader } from '@/components/ui/loading-states';
import { useRealtimeData } from '@/hooks/useRealtimeData';

// Lazy loading des pages
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Fleet = lazy(() => import('@/pages/Fleet'));
const Drivers = lazy(() => import('@/pages/Drivers'));
const Missions = lazy(() => import('@/pages/Missions'));
const Billing = lazy(() => import('@/pages/Billing'));
const RH = lazy(() => import('@/pages/RH'));
const Validations = lazy(() => import('@/pages/Validations'));
const Administration = lazy(() => import('@/pages/Administration'));
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

const ModernAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Activer les mises à jour en temps réel
  useRealtimeData();

  console.log('🔍 État de l\'app:', { user: !!user, loading });

  // Si pas d'utilisateur connecté, afficher la page de connexion
  if (!user && !loading) {
    console.log('📋 Aucun utilisateur - affichage du formulaire de connexion');
    return <LoginForm />;
  }

  // Si chargement en cours
  if (loading) {
    console.log('⏳ Chargement...');
    return <PageLoader message="Connexion..." />;
  }

  // Si utilisateur connecté, afficher l'application
  console.log('🏠 Affichage de l\'application pour:', user?.email);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PageLoader message="Chargement du module..." />}>
        {children}
      </Suspense>
    </div>
  );
};

const ModuleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <>
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
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ModernAppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<ModuleLayout><Dashboard /></ModuleLayout>} />
              <Route path="/fleet" element={<ModuleLayout><Fleet /></ModuleLayout>} />
              <Route path="/drivers" element={<ModuleLayout><Drivers /></ModuleLayout>} />
              <Route path="/missions" element={<ModuleLayout><Missions /></ModuleLayout>} />
              <Route path="/billing" element={<ModuleLayout><Billing /></ModuleLayout>} />
              <Route path="/rh" element={<ModuleLayout><RH /></ModuleLayout>} />
              <Route path="/validations" element={<ModuleLayout><Validations /></ModuleLayout>} />
              <Route path="/administration" element={<ModuleLayout><Administration /></ModuleLayout>} />
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
