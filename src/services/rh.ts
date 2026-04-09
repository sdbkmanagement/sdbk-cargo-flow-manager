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
    const XLSX = await import('xlsx');
    const errors: string[] = [];
    let imported = 0;

    const parseDate = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
      }
      const s = String(val).trim();
      const ddmmyyyy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }
      const iso = new Date(s);
      if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
      return null;
    };

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });

      if (rows.length === 0) {
        return { success: false, message: "Le fichier est vide", imported: 0, errors: ["Aucune donnée trouvée"] };
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const g = (keys: string[]) => { for (const k of keys) { if (row[k] !== undefined && row[k] !== '') return String(row[k]); } return null; };
        
        const nom = g(['Nom', 'nom']);
        const prenom = g(['Prénom', 'prenom']);
        const fonction = g(['Fonction', 'fonction', 'Poste', 'poste']) || 'Non défini';
        const service = g(['Service', 'service']) || 'Transport';

        if (!nom || !prenom) {
          errors.push(`Ligne ${i + 2}: Nom ou prénom manquant`);
          continue;
        }

        const dateNaissance = parseDate(g(['Date de naissance', 'date_naissance']));
        let age: number | null = null;
        if (dateNaissance) {
          const birth = new Date(dateNaissance);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }

        const { error } = await supabase.from('employes').insert({
          matricule: g(['Matricule', 'matricule']),
          immatricule_cnss: g(['Immatricule CNSS', 'immatricule_cnss']),
          nom,
          prenom,
          genre: g(['Genre', 'genre']),
          date_naissance: dateNaissance,
          lieu_naissance: g(['Lieu de naissance', 'lieu_naissance']),
          age,
          poste: fonction,
          fonction,
          service,
          date_embauche: parseDate(g(['Date embauche', 'date_embauche'])) || new Date().toISOString().split('T')[0],
          anciennete_transporteur: g(['Ancienneté transporteur', 'anciennete_transporteur']),
          type_contrat: g(['Type contrat', 'type_contrat']) || 'CDI',
          groupe_sanguin: g(['Groupe sanguin', 'groupe_sanguin']),
          date_derniere_visite_medicale: parseDate(g(['Date dernière visite médicale', 'date_derniere_visite_medicale'])),
          statut_visite_medicale: g(['Statut visite médicale', 'statut_visite_medicale']) || 'a_faire',
          date_prochaine_visite: parseDate(g(['Date prochaine visite', 'date_prochaine_visite'])),
          telephone: g(['Téléphone', 'telephone']),
          email: g(['Email', 'email']),
          nom_pere: g(['Nom du père', 'nom_pere']),
          nom_mere: g(['Nom de la mère', 'nom_mere']),
          diplome: g(['Diplôme', 'diplome']),
          personne_urgence: g(['Personne urgence', 'personne_urgence']),
          telephone_urgence: g(['Téléphone urgence', 'telephone_urgence']),
          statut: g(['Statut', 'statut']) || 'actif',
          remarques: g(['Remarques', 'remarques']),
        });

        if (error) {
          errors.push(`Ligne ${i + 2}: ${error.message}`);
        } else {
          imported++;
        }
      }

      return {
        success: imported > 0,
        message: imported > 0
          ? `${imported} employé(s) importé(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`
          : "Aucun employé importé",
        imported,
        errors,
      };
    } catch (error) {
      console.error('Erreur import employés:', error);
      return {
        success: false,
        message: "Erreur lors de la lecture du fichier",
        imported: 0,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"],
      };
    }
  }
};
