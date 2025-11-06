
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Fleet from '@/pages/Fleet';
import Missions from '@/pages/Missions';
import Drivers from '@/pages/Drivers';
import Billing from '@/pages/Billing';
import RH from '@/pages/RH';
import Administration from '@/pages/Administration';
import Validations from '@/pages/Validations';
import Clients from '@/pages/Clients';
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
            
            {/* Routes protégées avec nouveau layout fullscreen */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } 
            />
            <Route 
              path="/fleet" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Flotte" subtitle="Gestion véhicules et maintenance">
                    <Fleet />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/missions" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Missions" subtitle="Planification et suivi transports">
                    <Missions />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/drivers" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Chauffeurs" subtitle="Gestion conducteurs et documents">
                    <Drivers />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Facturation" subtitle="Devis, factures et paiements">
                    <Billing />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/rh" 
              element={
                <AuthGuard>
                  <ModuleLayout title="RH" subtitle="Ressources humaines et formations">
                    <RH />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Administration" subtitle="Utilisateurs, rôles et paramètres">
                    <Administration />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/validations" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Validations" subtitle="Workflows validation véhicules">
                    <Validations />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <AuthGuard>
                  <ModuleLayout title="Clients" subtitle="Gestion des clients et contacts">
                    <Clients />
                  </ModuleLayout>
                </AuthGuard>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
