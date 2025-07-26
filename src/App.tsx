
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Fleet from '@/pages/Fleet';
import Missions from '@/pages/Missions';
import Drivers from '@/pages/Drivers';
import Billing from '@/pages/Billing';
import RH from '@/pages/RH';
import Administration from '@/pages/Administration';
import Validations from '@/pages/Validations';
import NotFound from '@/pages/NotFound';
import Auth from '@/pages/Auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Route publique pour l'authentification */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Page d'accueil moderne sans layout */}
            <Route path="/" element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            } />
            
            {/* Routes protégées avec layout traditionnel */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Tableau de bord">
                    <Dashboard />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/fleet" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Gestion de la flotte">
                    <Fleet />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/missions" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Gestion des missions">
                    <Missions />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/drivers" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Gestion des chauffeurs">
                    <Drivers />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Facturation">
                    <Billing />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/rh" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Ressources Humaines">
                    <RH />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Administration">
                    <Administration />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/validations" 
              element={
                <AuthGuard>
                  <ResponsiveLayout title="Validations">
                    <Validations />
                  </ResponsiveLayout>
                </AuthGuard>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
