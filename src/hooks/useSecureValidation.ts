
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSecureValidation = () => {
  const { user } = useAuth();

  const validateUserPermission = async (requiredRole: string): Promise<boolean> => {
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }

    try {
      // Use the secure database function instead of client-side validation
      const { data, error } = await supabase.rpc('has_validation_role', {
        user_id: user.id,
        role_name: requiredRole
      });

      if (error) {
        console.error('❌ Permission validation error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('❌ Permission validation exception:', error);
      return false;
    }
  };

  const validateModuleAccess = async (module: string): Promise<boolean> => {
    if (!user) {
      console.log('❌ No authenticated user');
      return false;
    }

    try {
      // Use the secure database function
      const { data, error } = await supabase.rpc('has_module_permission', {
        user_id: user.id,
        module_name: module
      });

      if (error) {
        console.error('❌ Module access validation error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('❌ Module access validation exception:', error);
      return false;
    }
  };

  const isAdmin = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('❌ Admin check error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('❌ Admin check exception:', error);
      return false;
    }
  };

  return {
    validateUserPermission,
    validateModuleAccess,
    isAdmin
  };
};
