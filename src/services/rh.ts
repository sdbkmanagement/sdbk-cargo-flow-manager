import { supabase } from '@/integrations/supabase/client';

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  photo_url?: string;
  poste: string;
  service: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: 'actif' | 'inactif' | 'en_arret';
  type_contrat: 'CDI' | 'CDD' | 'Stage' | 'Interim';
  telephone?: string;
  email?: string;
  remarques?: string;
  created_at: string;
  updated_at: string;
}

export interface Absence {
  id: string;
  employe_id: string;
  type_absence: string;
  motif?: string;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  statut: 'en_attente' | 'approuve' | 'refuse';
  approuve_par?: string;
  commentaires?: string;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  employe_id: string;
  nom_formation: string;
  organisme?: string;
  date_debut: string;
  date_fin?: string;
  date_expiration?: string;
  certificat_url?: string;
  statut: 'valide' | 'expire' | 'a_renouveler';
  obligatoire: boolean;
  remarques?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoriqueRH {
  id: string;
  employe_id: string;
  type_evenement: string;
  ancien_poste?: string;
  nouveau_poste?: string;
  ancien_service?: string;
  nouveau_service?: string;
  description: string;
  date_evenement: string;
  saisi_par?: string;
  created_at: string;
}

export interface AlerteRH {
  type_alerte: string;
  employe_id: string;
  nom_complet: string;
  poste: string;
  service: string;
  message: string;
  date_echeance: string;
  priorite: 'normale' | 'importante' | 'critique';
}

// Services pour les employés
export const rhService = {
  // Employés
  async getEmployes(filters?: { service?: string; statut?: string; search?: string }) {
    let query = supabase
      .from('employes')
      .select('*')
      .order('nom', { ascending: true });

    if (filters?.service && filters.service !== 'tous') {
      query = query.eq('service', filters.service);
    }

    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }

    if (filters?.search) {
      query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,poste.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Employe[];
  },

  async createEmploye(employe: Omit<Employe, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employes')
      .insert([employe])
      .select()
      .single();

    if (error) throw error;
    return data as Employe;
  },

  async updateEmploye(id: string, updates: Partial<Employe>) {
    const { data, error } = await supabase
      .from('employes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Employe;
  },

  async deleteEmploye(id: string) {
    const { error } = await supabase
      .from('employes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Absences
  async getAbsences(employeId?: string) {
    let query = supabase
      .from('absences')
      .select(`
        *,
        employe:employes(nom, prenom, poste, service)
      `)
      .order('date_debut', { ascending: false });

    if (employeId) {
      query = query.eq('employe_id', employeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createAbsence(absence: Omit<Absence, 'id' | 'nombre_jours' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('absences')
      .insert([absence])
      .select()
      .single();

    if (error) throw error;
    return data as Absence;
  },

  // Formations
  async getFormations(employeId?: string) {
    let query = supabase
      .from('formations_employes')
      .select(`
        *,
        employe:employes(nom, prenom, poste, service)
      `)
      .order('date_debut', { ascending: false });

    if (employeId) {
      query = query.eq('employe_id', employeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createFormation(formation: Omit<Formation, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('formations_employes')
      .insert([formation])
      .select()
      .single();

    if (error) throw error;
    return data as Formation;
  },

  // Historique RH
  async getHistoriqueRH(employeId?: string) {
    let query = supabase
      .from('historique_rh')
      .select(`
        *,
        employe:employes(nom, prenom, poste, service)
      `)
      .order('date_evenement', { ascending: false });

    if (employeId) {
      query = query.eq('employe_id', employeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Alertes RH - remplacer la vue par une requête directe
  async getAlertesRH() {
    // Compter les documents chauffeurs qui expirent bientôt
    const { data, error } = await supabase
      .from('documents')
      .select('id, entity_id, nom, type, date_expiration')
      .eq('entity_type', 'chauffeur')
      .not('date_expiration', 'is', null)
      .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date_expiration', { ascending: true });

    if (error) throw error;
    
    // Transformer en format AlerteRH simulé
    const alertesSimulees = (data || []).map(doc => ({
      type_alerte: 'document_expiration',
      employe_id: doc.entity_id || '',
      nom_complet: 'Document ' + doc.nom,
      poste: 'Chauffeur',
      service: 'Transport',
      priorite: 'moyenne' as const,
      description: `Document ${doc.type} expire bientôt`,
      date_creation: doc.date_expiration || ''
    }));

    return alertesSimulees;
  },

  // Statistiques
  async getStatsRH() {
    const [employes, absences, formations] = await Promise.all([
      this.getEmployes(),
      this.getAbsences(),
      this.getFormations()
    ]);

    const stats = {
      totalEmployes: employes.length,
      employesActifs: employes.filter(e => e.statut === 'actif').length,
      employesInactifs: employes.filter(e => e.statut === 'inactif').length,
      employesEnArret: employes.filter(e => e.statut === 'en_arret').length,
      absencesEnCours: absences?.filter(a => {
        const today = new Date();
        const debut = new Date(a.date_debut);
        const fin = new Date(a.date_fin);
        return debut <= today && fin >= today && a.statut === 'approuve';
      }).length || 0,
      formationsARenouveler: formations?.filter(f => {
        if (!f.date_expiration || !f.obligatoire) return false;
        const today = new Date();
        const expiration = new Date(f.date_expiration);
        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length || 0
    };

    return stats;
  },

  async importEmployees(file: File): Promise<{ success: boolean; message: string; imported: number; errors: string[] }> {
    try {
      // Simuler l'import pour le moment
      return {
        success: true,
        message: "Import simulé - fonctionnalité à implémenter",
        imported: 0,
        errors: []
      };
    } catch (error) {
      console.error('Erreur import employés:', error);
      return {
        success: false,
        message: "Erreur lors de l'import",
        imported: 0,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"]
      };
    }
  }
};
