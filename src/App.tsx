
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
            <Route path="/*" element={
              <AuthGuard>
                <ResponsiveLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/fleet" element={<Fleet />} />
                    <Route path="/missions" element={<Missions />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/rh" element={<RH />} />
                    <Route path="/admin" element={<Administration />} />
                    <Route path="/validations" element={<Validations />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ResponsiveLayout>
              </AuthGuard>
            } />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
