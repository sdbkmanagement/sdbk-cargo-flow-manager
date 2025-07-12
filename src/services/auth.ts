
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import type { User, LoginCredentials, AuthUser, UserSession } from '@/types/user';

class AuthService {
  private readonly SESSION_KEY = 'sdbk_session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // Récupérer l'utilisateur par email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .eq('status', 'active')
        .single();

      if (userError || !user) {
        throw new Error('Identifiants invalides');
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Identifiants invalides');
      }

      // Créer une session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();

      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        });

      if (sessionError) {
        throw new Error('Erreur lors de la création de session');
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      const authUser: AuthUser = {
        ...user,
        session_token: sessionToken,
        expires_at: expiresAt
      };

      // Stocker la session localement
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt
      }));

      return authUser;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        // Supprimer la session de la base
        await supabase
          .from('user_sessions')
          .delete()
          .eq('session_token', session.session_token);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer la session locale
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * Vérifier la session actuelle
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const session = this.getStoredSession();
      if (!session || new Date(session.expires_at) < new Date()) {
        await this.logout();
        return null;
      }

      // Vérifier si la session existe toujours en base
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', session.session_token)
        .eq('user_id', session.user_id)
        .single();

      if (sessionError || !sessionData || new Date(sessionData.expires_at) < new Date()) {
        await this.logout();
        return null;
      }

      // Récupérer les données utilisateur
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .eq('status', 'active')
        .single();

      if (userError || !user) {
        await this.logout();
        return null;
      }

      return {
        ...user,
        session_token: session.session_token,
        expires_at: session.expires_at
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
      await this.logout();
      return null;
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(user: User | null, role: string): boolean {
    return user ? user.roles.includes(role as any) : false;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, 'admin');
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getStoredSession(): { user_id: string; session_token: string; expires_at: string } | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }
}

export const authService = new AuthService();
