import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mise à jour des utilisateurs demo avec la nouvelle structure
const demoUsers: User[] = [
  {
    id: '1',
    nom: 'Admin',
    prenom: 'Système',
    email: 'admin@sdbk.com',
    role: 'admin',
    permissions: ['all'] // Admin a tous les droits
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'maintenance@sdbk.com',
    role: 'maintenance',
    permissions: ['fleet_read', 'fleet_write', 'validation_maintenance']
  },
  {
    id: '3',
    nom: 'Bernard',
    prenom: 'Pierre',
    email: 'transport@sdbk.com',
    role: 'transport',
    permissions: ['missions_read', 'missions_write', 'drivers_read', 'drivers_write']
  },
  {
    id: '4',
    nom: 'Diallo',
    prenom: 'Fatou',
    email: 'rh@sdbk.com',
    role: 'rh',
    permissions: ['drivers_read', 'drivers_write', 'hr_read', 'hr_write']
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Simulation de connexion
    const foundUser = demoUsers.find(u => u.email === email);
    if (foundUser && password === 'demo123') {
      setUser(foundUser);
    } else {
      throw new Error('Identifiants invalides');
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // L'admin a tous les droits
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole) => {
    if (!user) return false;
    // L'admin peut accéder à tous les rôles
    return user.role === role || user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
