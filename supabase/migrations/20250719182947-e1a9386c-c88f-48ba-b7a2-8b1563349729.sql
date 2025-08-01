
-- Ajouter les nouveaux champs à la table chauffeurs
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS matricule VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_conducteur VARCHAR(50),
ADD COLUMN IF NOT EXISTS immatricule_cnss VARCHAR(50),
ADD COLUMN IF NOT EXISTS fonction VARCHAR(20) CHECK (fonction IN ('titulaire', 'reserve', 'doublon')),
ADD COLUMN IF NOT EXISTS base_chauffeur VARCHAR(20) CHECK (base_chauffeur IN ('conakry', 'kankan', 'nzerekore')),
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_embauche DATE,
ADD COLUMN IF NOT EXISTS groupe_sanguin VARCHAR(10),
ADD COLUMN IF NOT EXISTS filiation TEXT,
ADD COLUMN IF NOT EXISTS statut_matrimonial VARCHAR(20),
ADD COLUMN IF NOT EXISTS statut_disponibilite VARCHAR(20) DEFAULT 'disponible' CHECK (statut_disponibilite IN ('disponible', 'en_conge', 'maladie', 'indisponible')),
ADD COLUMN IF NOT EXISTS date_debut_statut DATE,
ADD COLUMN IF NOT EXISTS date_fin_statut DATE;

-- Créer la table pour l'historique des changements de statut
CREATE TABLE IF NOT EXISTS public.chauffeurs_statut_historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chauffeur_id UUID REFERENCES chauffeurs(id) ON DELETE CASCADE,
  ancien_statut VARCHAR(20),
  nouveau_statut VARCHAR(20) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE,
  motif TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Créer la fonction pour automatiquement remettre les chauffeurs disponibles
CREATE OR REPLACE FUNCTION public.update_chauffeur_statut_expired()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remettre automatiquement les chauffeurs disponibles quand leur période d'indisponibilité expire
  UPDATE public.chauffeurs 
  SET 
    statut_disponibilite = 'disponible',
    date_debut_statut = CURRENT_DATE,
    date_fin_statut = NULL
  WHERE 
    statut_disponibilite != 'disponible' 
    AND date_fin_statut IS NOT NULL 
    AND date_fin_statut <= CURRENT_DATE;
END;
$$;

-- Créer la vue pour les alertes de documents chauffeurs avec les nouveaux types
DROP VIEW IF EXISTS public.alertes_documents_chauffeurs;
CREATE VIEW public.alertes_documents_chauffeurs AS
SELECT 
  d.id,
  d.entity_id as chauffeur_id,
  d.date_expiration,
  EXTRACT(DAY FROM d.date_expiration - CURRENT_DATE)::INTEGER as jours_restants,
  CONCAT(c.prenom, ' ', c.nom) as chauffeur_nom,
  d.nom as document_nom,
  d.type as document_type,
  CASE 
    WHEN d.date_expiration < CURRENT_DATE THEN 'expire'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'a_renouveler'
    ELSE 'valide'
  END as statut,
  CASE 
    WHEN d.date_expiration < CURRENT_DATE THEN 'URGENT - Document expiré'
    WHEN d.date_expiration <= (CURRENT_DATE + INTERVAL '30 days') THEN 'ATTENTION - Expire bientôt'
    ELSE 'OK'
  END as niveau_alerte
FROM public.documents d
JOIN public.chauffeurs c ON d.entity_id = c.id
WHERE 
  d.entity_type = 'chauffeur' 
  AND d.date_expiration IS NOT NULL
  AND d.statut != 'expire';

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.chauffeurs_statut_historique ENABLE ROW LEVEL SECURITY;

-- Policies pour l'historique des statuts des chauffeurs
CREATE POLICY "Tous peuvent voir l'historique des statuts" ON public.chauffeurs_statut_historique
  FOR SELECT USING (true);

CREATE POLICY "Tous peuvent créer l'historique des statuts" ON public.chauffeurs_statut_historique
  FOR INSERT WITH CHECK (true);

-- Trigger pour ajouter à l'historique lors des changements de statut
CREATE OR REPLACE FUNCTION public.add_chauffeur_statut_to_historique()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ajouter à l'historique si le statut de disponibilité change
  IF TG_OP = 'UPDATE' AND OLD.statut_disponibilite != NEW.statut_disponibilite THEN
    INSERT INTO public.chauffeurs_statut_historique (
      chauffeur_id, 
      ancien_statut, 
      nouveau_statut, 
      date_debut, 
      date_fin
    )
    VALUES (
      NEW.id, 
      OLD.statut_disponibilite, 
      NEW.statut_disponibilite, 
      NEW.date_debut_statut, 
      NEW.date_fin_statut
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_chauffeur_statut_historique ON public.chauffeurs;
CREATE TRIGGER trigger_chauffeur_statut_historique
  AFTER UPDATE ON public.chauffeurs
  FOR EACH ROW
  EXECUTE FUNCTION public.add_chauffeur_statut_to_historique();
