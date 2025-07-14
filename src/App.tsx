
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserMenu } from '@/components/layout/UserMenu';

// Lazy loading pour améliorer les performances
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
      retry: 1,
    },
  },
});

// Composant de chargement optimisé
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-sm text-gray-600">Chargement du module...</p>
    </div>
  </div>
);

// Composant de connexion simplifié
const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8 p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">SDBK Cargo Flow Manager</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Connexion requise</h3>
          <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à l'application.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Actualiser la page
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Layout principal optimisé
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initialized } = useAuth();

  console.log('AppLayout - User:', user, 'Loading:', loading);

  // Affichage pendant l'initialisation
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialisation en cours...</h2>
          <p className="text-gray-600">Vérification de votre session</p>
        </div>
      </div>
    );
  }

  // Affichage pendant le chargement de l'utilisateur
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connexion en cours...</h2>
          <p className="text-gray-600">Chargement de votre profil</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté, afficher la page de connexion
  if (!user) {
    console.log('No user found, showing login page');
    return <LoginPage />;
  }

  console.log('User authenticated, showing app layout');

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">SDBK Transport Manager</h1>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
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
          <AppLayout>
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
          </AppLayout>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
