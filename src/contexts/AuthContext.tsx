
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log('🔐 Connexion pour:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Connexion réussie');
        // Créer un utilisateur simple avec les données de base
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          nom: '',
          prenom: '',
          role: 'transport'
        };
        
        setUser(authUser);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Échec de la connexion' };
    } catch (error: any) {
      console.error('❌ Exception lors de la connexion:', error);
      setLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
