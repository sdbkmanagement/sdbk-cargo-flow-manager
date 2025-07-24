
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'user_created' | 'permission_change' | 'data_access';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  user_id: string;
  ip_address: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
  ip_address?: string;
}
