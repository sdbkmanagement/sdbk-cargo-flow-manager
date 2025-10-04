
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { MaintenancePage } from '@/components/maintenance/MaintenancePage';
import { Loader2 } from 'lucide-react';

// 🔧 MODE MAINTENANCE: Changez cette valeur à true pour activer la page de maintenance
const MAINTENANCE_MODE = false;

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si mode maintenance activé, afficher la page de maintenance
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  // Si pas d'utilisateur connecté, afficher la page de login
  if (!user) {
    return <LoginForm />;
  }

  // Tous les utilisateurs connectés accèdent au contenu protégé
  // (Hub des modules ou module spécifique selon la route)
  return <>{children}</>;
};
