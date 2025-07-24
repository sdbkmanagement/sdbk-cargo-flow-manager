
import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private static sessionTimer: NodeJS.Timeout | null = null;
  private static warningTimer: NodeJS.Timeout | null = null;

  static startSession(): void {
    this.clearTimers();
    this.setSessionTimer();
  }

  static extendSession(): void {
    this.clearTimers();
    this.setSessionTimer();
  }

  static endSession(): void {
    this.clearTimers();
    this.logoutUser();
  }

  private static setSessionTimer(): void {
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);

    // Set session timeout
    this.sessionTimer = setTimeout(() => {
      this.logoutUser();
    }, this.SESSION_TIMEOUT);
  }

  private static clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private static showSessionWarning(): void {
    const extendSession = confirm(
      'Your session will expire in 5 minutes. Do you want to extend it?'
    );
    
    if (extendSession) {
      this.extendSession();
    }
  }

  private static async logoutUser(): Promise<void> {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  }

  static setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const resetTimer = () => {
      this.extendSession();
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
  }
}

// Initialize session management
if (typeof window !== 'undefined') {
  SessionManager.setupActivityListeners();
}
