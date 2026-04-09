
-- =============================================
-- GESTION
-- =============================================

-- Contrats de travail
CREATE TABLE public.contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_contrat VARCHAR(50) NOT NULL DEFAULT 'CDI',
  date_debut DATE NOT NULL,
  date_fin DATE,
  date_renouvellement DATE,
  salaire_base NUMERIC(12,2),
  devise VARCHAR(10) DEFAULT 'GNF',
  duree_periode_essai INTEGER,
  statut VARCHAR(30) DEFAULT 'actif',
  motif_fin VARCHAR(255),
  fichier_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access contrats" ON public.contrats FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read contrats" ON public.contrats FOR SELECT TO authenticated
  USING (true);

-- Carrières
CREATE TABLE public.carrieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_evenement VARCHAR(50) NOT NULL,
  ancien_poste VARCHAR(255),
  nouveau_poste VARCHAR(255),
  ancien_service VARCHAR(255),
  nouveau_service VARCHAR(255),
  ancien_salaire NUMERIC(12,2),
  nouveau_salaire NUMERIC(12,2),
  date_effet DATE NOT NULL,
  motif TEXT,
  decision_par VARCHAR(255),
  fichier_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.carrieres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access carrieres" ON public.carrieres FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read carrieres" ON public.carrieres FOR SELECT TO authenticated
  USING (true);

-- Sanctions
CREATE TABLE public.sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_sanction VARCHAR(100) NOT NULL,
  motif TEXT NOT NULL,
  date_sanction DATE NOT NULL,
  duree_jours INTEGER,
  date_debut DATE,
  date_fin DATE,
  decision_par VARCHAR(255),
  statut VARCHAR(30) DEFAULT 'active',
  fichier_url TEXT,
  commentaires TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access sanctions" ON public.sanctions FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read sanctions" ON public.sanctions FOR SELECT TO authenticated
  USING (true);

-- Accidents de travail
CREATE TABLE public.accidents_travail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_accident DATE NOT NULL,
  heure_accident TIME,
  lieu VARCHAR(255),
  description TEXT NOT NULL,
  gravite VARCHAR(30) DEFAULT 'leger',
  type_blessure VARCHAR(255),
  temoins TEXT,
  jours_arret INTEGER DEFAULT 0,
  date_reprise DATE,
  declaration_cnss BOOLEAN DEFAULT false,
  numero_declaration VARCHAR(100),
  statut VARCHAR(30) DEFAULT 'declare',
  fichier_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accidents_travail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access accidents" ON public.accidents_travail FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read accidents" ON public.accidents_travail FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- TEMPS DE TRAVAIL
-- =============================================

-- Pointages
CREATE TABLE public.pointages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_pointage DATE NOT NULL,
  heure_arrivee TIME,
  heure_depart TIME,
  heures_travaillees NUMERIC(5,2),
  statut VARCHAR(30) DEFAULT 'present',
  retard_minutes INTEGER DEFAULT 0,
  motif_absence TEXT,
  valide_par VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employe_id, date_pointage)
);

ALTER TABLE public.pointages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access pointages" ON public.pointages FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read pointages" ON public.pointages FOR SELECT TO authenticated
  USING (true);

-- Congés
CREATE TABLE public.conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_conge VARCHAR(50) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_jours NUMERIC(5,1),
  motif TEXT,
  statut VARCHAR(30) DEFAULT 'en_attente',
  approuve_par VARCHAR(255),
  date_approbation DATE,
  commentaires TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access conges" ON public.conges FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read conges" ON public.conges FOR SELECT TO authenticated
  USING (true);

-- Heures supplémentaires
CREATE TABLE public.heures_supplementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_hs DATE NOT NULL,
  nombre_heures NUMERIC(5,2) NOT NULL,
  taux_majoration NUMERIC(5,2) DEFAULT 1.5,
  motif TEXT,
  statut VARCHAR(30) DEFAULT 'en_attente',
  approuve_par VARCHAR(255),
  montant NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.heures_supplementaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access hs" ON public.heures_supplementaires FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read hs" ON public.heures_supplementaires FOR SELECT TO authenticated
  USING (true);

-- Jours fériés
CREATE TABLE public.jours_feries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  date_ferie DATE NOT NULL,
  recurrent BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.jours_feries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access jours_feries" ON public.jours_feries FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read jours_feries" ON public.jours_feries FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- PAIE
-- =============================================

-- Périodes de paie
CREATE TABLE public.periodes_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut VARCHAR(30) DEFAULT 'ouverte',
  cloturee_par VARCHAR(255),
  date_cloture DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mois, annee)
);

ALTER TABLE public.periodes_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access periodes_paie" ON public.periodes_paie FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read periodes_paie" ON public.periodes_paie FOR SELECT TO authenticated
  USING (true);

-- Rubriques de paie (configuration)
CREATE TABLE public.rubriques_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  categorie VARCHAR(50),
  taux NUMERIC(8,4),
  montant_fixe NUMERIC(12,2),
  base_calcul VARCHAR(50),
  plafond NUMERIC(12,2),
  obligatoire BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rubriques_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access rubriques_paie" ON public.rubriques_paie FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read rubriques_paie" ON public.rubriques_paie FOR SELECT TO authenticated
  USING (true);

-- Éléments de salaire par employé
CREATE TABLE public.elements_salaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  salaire_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  prime_transport NUMERIC(12,2) DEFAULT 0,
  prime_logement NUMERIC(12,2) DEFAULT 0,
  prime_risque NUMERIC(12,2) DEFAULT 0,
  prime_anciennete NUMERIC(12,2) DEFAULT 0,
  prime_rendement NUMERIC(12,2) DEFAULT 0,
  indemnite_repas NUMERIC(12,2) DEFAULT 0,
  autres_primes NUMERIC(12,2) DEFAULT 0,
  devise VARCHAR(10) DEFAULT 'GNF',
  date_effet DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.elements_salaire ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access elements_salaire" ON public.elements_salaire FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read elements_salaire" ON public.elements_salaire FOR SELECT TO authenticated
  USING (true);

-- Bulletins de paie
CREATE TABLE public.bulletins_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  periode_id UUID NOT NULL REFERENCES public.periodes_paie(id) ON DELETE CASCADE,
  numero VARCHAR(50),
  salaire_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_primes NUMERIC(12,2) DEFAULT 0,
  total_indemnites NUMERIC(12,2) DEFAULT 0,
  salaire_brut NUMERIC(12,2) NOT NULL DEFAULT 0,
  cotisation_cnss_employe NUMERIC(12,2) DEFAULT 0,
  cotisation_cnss_employeur NUMERIC(12,2) DEFAULT 0,
  irg NUMERIC(12,2) DEFAULT 0,
  autres_retenues NUMERIC(12,2) DEFAULT 0,
  retenue_pret NUMERIC(12,2) DEFAULT 0,
  total_retenues NUMERIC(12,2) DEFAULT 0,
  salaire_net NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_a_payer NUMERIC(12,2) NOT NULL DEFAULT 0,
  statut VARCHAR(30) DEFAULT 'brouillon',
  valide_par VARCHAR(255),
  date_validation DATE,
  date_paiement DATE,
  mode_paiement VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bulletins_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access bulletins_paie" ON public.bulletins_paie FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read bulletins_paie" ON public.bulletins_paie FOR SELECT TO authenticated
  USING (true);

-- Lignes de bulletins de paie
CREATE TABLE public.bulletins_paie_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES public.bulletins_paie(id) ON DELETE CASCADE,
  rubrique_id UUID REFERENCES public.rubriques_paie(id),
  libelle VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  base NUMERIC(12,2),
  taux NUMERIC(8,4),
  montant_salarial NUMERIC(12,2) DEFAULT 0,
  montant_patronal NUMERIC(12,2) DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bulletins_paie_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access bulletins_lignes" ON public.bulletins_paie_lignes FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read bulletins_lignes" ON public.bulletins_paie_lignes FOR SELECT TO authenticated
  USING (true);

-- Prêts
CREATE TABLE public.prets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  montant_total NUMERIC(12,2) NOT NULL,
  montant_mensualite NUMERIC(12,2) NOT NULL,
  nombre_echeances INTEGER NOT NULL,
  echeances_payees INTEGER DEFAULT 0,
  solde_restant NUMERIC(12,2),
  taux_interet NUMERIC(5,2) DEFAULT 0,
  date_debut DATE NOT NULL,
  date_fin DATE,
  motif TEXT,
  statut VARCHAR(30) DEFAULT 'en_cours',
  approuve_par VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access prets" ON public.prets FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read prets" ON public.prets FOR SELECT TO authenticated
  USING (true);

-- Notes de frais
CREATE TABLE public.notes_frais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  date_note DATE NOT NULL,
  categorie VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  montant NUMERIC(12,2) NOT NULL,
  devise VARCHAR(10) DEFAULT 'GNF',
  justificatif_url TEXT,
  statut VARCHAR(30) DEFAULT 'soumise',
  approuve_par VARCHAR(255),
  date_approbation DATE,
  date_remboursement DATE,
  commentaires TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notes_frais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access notes_frais" ON public.notes_frais FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read notes_frais" ON public.notes_frais FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- MODULES ANNEXES
-- =============================================

-- Recrutement
CREATE TABLE public.recrutement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poste VARCHAR(255) NOT NULL,
  service VARCHAR(100),
  nombre_postes INTEGER DEFAULT 1,
  candidat_nom VARCHAR(255),
  candidat_prenom VARCHAR(255),
  candidat_email VARCHAR(255),
  candidat_telephone VARCHAR(50),
  cv_url TEXT,
  date_candidature DATE,
  date_entretien DATE,
  etape VARCHAR(50) DEFAULT 'candidature',
  resultat VARCHAR(50),
  notes TEXT,
  recruteur VARCHAR(255),
  statut VARCHAR(30) DEFAULT 'ouvert',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recrutement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access recrutement" ON public.recrutement FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read recrutement" ON public.recrutement FOR SELECT TO authenticated
  USING (true);

-- Évaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  evaluateur VARCHAR(255),
  periode VARCHAR(50) NOT NULL,
  date_evaluation DATE NOT NULL,
  note_globale NUMERIC(4,2),
  performance VARCHAR(30),
  objectifs_atteints TEXT,
  points_forts TEXT,
  points_amelioration TEXT,
  objectifs_prochaine_periode TEXT,
  commentaires TEXT,
  statut VARCHAR(30) DEFAULT 'en_cours',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access evaluations" ON public.evaluations FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read evaluations" ON public.evaluations FOR SELECT TO authenticated
  USING (true);

-- Réclamations
CREATE TABLE public.reclamations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_reclamation VARCHAR(100) NOT NULL,
  objet VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priorite VARCHAR(30) DEFAULT 'normale',
  statut VARCHAR(30) DEFAULT 'ouverte',
  traite_par VARCHAR(255),
  date_resolution DATE,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reclamations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access reclamations" ON public.reclamations FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read reclamations" ON public.reclamations FOR SELECT TO authenticated
  USING (true);

-- Visites médicales
CREATE TABLE public.visites_medicales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_visite VARCHAR(50) NOT NULL,
  date_visite DATE NOT NULL,
  date_prochaine DATE,
  medecin VARCHAR(255),
  resultat VARCHAR(50) DEFAULT 'apte',
  restrictions TEXT,
  observations TEXT,
  certificat_url TEXT,
  statut VARCHAR(30) DEFAULT 'planifie',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.visites_medicales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access visites_medicales" ON public.visites_medicales FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read visites_medicales" ON public.visites_medicales FOR SELECT TO authenticated
  USING (true);

-- Déclarations CNSS
CREATE TABLE public.cnss_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_id UUID REFERENCES public.periodes_paie(id),
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  nombre_employes INTEGER,
  masse_salariale NUMERIC(15,2),
  cotisation_salariale NUMERIC(12,2),
  cotisation_patronale NUMERIC(12,2),
  total_cotisation NUMERIC(12,2),
  date_declaration DATE,
  date_paiement DATE,
  numero_bordereau VARCHAR(100),
  statut VARCHAR(30) DEFAULT 'brouillon',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cnss_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access cnss" ON public.cnss_declarations FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read cnss" ON public.cnss_declarations FOR SELECT TO authenticated
  USING (true);

-- Inspections du travail
CREATE TABLE public.inspections_travail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_inspection DATE NOT NULL,
  inspecteur_nom VARCHAR(255),
  type_inspection VARCHAR(100),
  objet TEXT,
  observations TEXT,
  non_conformites TEXT,
  actions_correctives TEXT,
  date_limite_correction DATE,
  statut VARCHAR(30) DEFAULT 'planifie',
  pv_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inspections_travail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access inspections" ON public.inspections_travail FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read inspections" ON public.inspections_travail FOR SELECT TO authenticated
  USING (true);

-- Configuration paie
CREATE TABLE public.config_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cle VARCHAR(100) NOT NULL UNIQUE,
  valeur VARCHAR(255) NOT NULL,
  description TEXT,
  categorie VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.config_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/RH full access config_paie" ON public.config_paie FOR ALL TO authenticated
  USING (public.is_admin_or_rh(auth.uid()))
  WITH CHECK (public.is_admin_or_rh(auth.uid()));
CREATE POLICY "Authenticated read config_paie" ON public.config_paie FOR SELECT TO authenticated
  USING (true);

-- Insérer les rubriques de paie par défaut (Guinée)
INSERT INTO public.rubriques_paie (code, nom, type, categorie, taux, base_calcul, obligatoire, ordre) VALUES
('SAL_BASE', 'Salaire de base', 'gain', 'salaire', NULL, NULL, true, 1),
('PRI_TRANS', 'Prime de transport', 'gain', 'prime', NULL, NULL, false, 2),
('PRI_LOG', 'Prime de logement', 'gain', 'prime', NULL, NULL, false, 3),
('PRI_RISQ', 'Prime de risque', 'gain', 'prime', NULL, NULL, false, 4),
('PRI_ANC', 'Prime d''ancienneté', 'gain', 'prime', NULL, NULL, false, 5),
('PRI_REND', 'Prime de rendement', 'gain', 'prime', NULL, NULL, false, 6),
('IND_REPAS', 'Indemnité de repas', 'gain', 'indemnite', NULL, NULL, false, 7),
('CNSS_SAL', 'CNSS Part salariale', 'retenue', 'cotisation', 5.0000, 'brut', true, 10),
('CNSS_PAT', 'CNSS Part patronale', 'charge_patronale', 'cotisation', 18.0000, 'brut', true, 11),
('IRG', 'Impôt sur le Revenu (IRG)', 'retenue', 'impot', NULL, 'brut_imposable', true, 12),
('RET_PRET', 'Retenue sur prêt', 'retenue', 'retenue', NULL, NULL, false, 15),
('AVA_SAL', 'Avance sur salaire', 'retenue', 'retenue', NULL, NULL, false, 16);

-- Insérer la configuration paie par défaut
INSERT INTO public.config_paie (cle, valeur, description, categorie) VALUES
('taux_cnss_salarial', '5', 'Taux CNSS part salariale (%)', 'cnss'),
('taux_cnss_patronal', '18', 'Taux CNSS part patronale (%)', 'cnss'),
('plafond_cnss', '0', 'Plafond mensuel CNSS (0 = pas de plafond)', 'cnss'),
('smig', '440000', 'SMIG en vigueur (GNF)', 'general'),
('devise', 'GNF', 'Devise par défaut', 'general'),
('heures_mensuelles', '173.33', 'Nombre d''heures mensuelles légales', 'general'),
('taux_hs_25', '1.25', 'Taux heures sup 25%', 'heures_sup'),
('taux_hs_50', '1.50', 'Taux heures sup 50%', 'heures_sup'),
('taux_hs_100', '2.00', 'Taux heures sup 100% (nuit/férié)', 'heures_sup');

-- Insérer les jours fériés de Guinée
INSERT INTO public.jours_feries (nom, date_ferie, recurrent, description) VALUES
('Jour de l''An', '2026-01-01', true, 'Nouvel an'),
('Fête du Travail', '2026-05-01', true, 'Journée internationale du travail'),
('Anniversaire du 2 Octobre', '2026-10-02', true, 'Fête nationale de la Guinée'),
('Noël', '2026-12-25', true, 'Noël'),
('Fête de l''Indépendance', '2026-10-02', true, 'Indépendance de la Guinée');

-- Trigger updated_at pour les nouvelles tables
CREATE TRIGGER update_contrats_updated_at BEFORE UPDATE ON public.contrats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carrieres_updated_at BEFORE UPDATE ON public.carrieres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sanctions_updated_at BEFORE UPDATE ON public.sanctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accidents_updated_at BEFORE UPDATE ON public.accidents_travail FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pointages_updated_at BEFORE UPDATE ON public.pointages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conges_updated_at BEFORE UPDATE ON public.conges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hs_updated_at BEFORE UPDATE ON public.heures_supplementaires FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_periodes_paie_updated_at BEFORE UPDATE ON public.periodes_paie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rubriques_paie_updated_at BEFORE UPDATE ON public.rubriques_paie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_elements_salaire_updated_at BEFORE UPDATE ON public.elements_salaire FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bulletins_paie_updated_at BEFORE UPDATE ON public.bulletins_paie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prets_updated_at BEFORE UPDATE ON public.prets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_frais_updated_at BEFORE UPDATE ON public.notes_frais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recrutement_updated_at BEFORE UPDATE ON public.recrutement FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reclamations_updated_at BEFORE UPDATE ON public.reclamations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visites_updated_at BEFORE UPDATE ON public.visites_medicales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cnss_updated_at BEFORE UPDATE ON public.cnss_declarations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections_travail FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
