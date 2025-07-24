
import { supabase } from '@/integrations/supabase/client';

export const userSyncDiagnostic = {
  async diagnoseUserSync() {
    console.log('🔍 Diagnostic de synchronisation des utilisateurs...');
    
    try {
      // Récupérer tous les utilisateurs de la table users
      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('❌ Erreur lors de la récupération des utilisateurs DB:', dbError);
        return { success: false, error: dbError.message };
      }

      console.log('📊 Utilisateurs dans la table users:', dbUsers?.length || 0);

      // Vérifier chaque utilisateur dans auth.users
      const syncIssues = [];
      const validUsers = [];

      for (const dbUser of dbUsers || []) {
        console.log(`🔍 Vérification de ${dbUser.email} (ID: ${dbUser.id})`);
        
        try {
          // Essayer de récupérer l'utilisateur par ID
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(dbUser.id);
          
          if (authError || !authUser.user) {
            console.log(`⚠️ Utilisateur ${dbUser.email} introuvable dans auth.users par ID`);
            syncIssues.push({
              email: dbUser.email,
              dbId: dbUser.id,
              issue: 'missing_in_auth',
              details: authError?.message || 'User not found in auth.users'
            });
          } else {
            console.log(`✅ Utilisateur ${dbUser.email} trouvé dans auth.users`);
            validUsers.push({
              email: dbUser.email,
              dbId: dbUser.id,
              authId: authUser.user.id,
              synced: dbUser.id === authUser.user.id
            });
          }
        } catch (error) {
          console.log(`❌ Erreur lors de la vérification de ${dbUser.email}:`, error);
          syncIssues.push({
            email: dbUser.email,
            dbId: dbUser.id,
            issue: 'verification_error',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: true,
        stats: {
          totalDbUsers: dbUsers?.length || 0,
          validUsers: validUsers.length,
          syncIssues: syncIssues.length
        },
        validUsers,
        syncIssues
      };

    } catch (error) {
      console.error('❌ Erreur générale du diagnostic:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  },

  async cleanupUsers() {
    console.log('🧹 Nettoyage des utilisateurs...');
    
    try {
      // D'abord, faire un diagnostic
      const diagnostic = await this.diagnoseUserSync();
      
      if (!diagnostic.success) {
        return { success: false, error: 'Échec du diagnostic' };
      }

      console.log('📊 Résultats du diagnostic:', diagnostic.stats);

      // Supprimer les utilisateurs problématiques de la table users
      const usersToDelete = diagnostic.syncIssues?.map(issue => issue.dbId) || [];
      
      if (usersToDelete.length > 0) {
        console.log(`🗑️ Suppression de ${usersToDelete.length} utilisateurs problématiques...`);
        
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .in('id', usersToDelete);

        if (deleteError) {
          console.error('❌ Erreur lors de la suppression:', deleteError);
          return { success: false, error: deleteError.message };
        }

        console.log('✅ Utilisateurs problématiques supprimés');
      }

      return {
        success: true,
        message: `Nettoyage terminé. ${usersToDelete.length} utilisateurs supprimés.`,
        deletedUsers: usersToDelete.length
      };

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }
};
