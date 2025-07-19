
-- Ajouter les nouveaux champs manquants à la table chauffeurs
ALTER TABLE public.chauffeurs 
ADD COLUMN IF NOT EXISTS statut_disponibilite VARCHAR(20) DEFAULT 'disponible' CHECK (statut_disponibilite IN ('disponible', 'en_conge', 'maladie', 'indisponible')),
ADD COLUMN IF NOT EXISTS date_debut_statut DATE,
ADD COLUMN IF NOT EXISTS date_fin_statut DATE;

-- Créer un index unique sur matricule pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_chauffeurs_matricule_unique ON public.chauffeurs(matricule) WHERE matricule IS NOT NULL;

-- Créer un index unique sur id_conducteur pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_chauffeurs_id_conducteur_unique ON public.chauffeurs(id_conducteur) WHERE id_conducteur IS NOT NULL;

-- Ajouter des contraintes pour les champs fonction et base_chauffeur
ALTER TABLE public.chauffeurs 
DROP CONSTRAINT IF EXISTS chauffeurs_fonction_check,
ADD CONSTRAINT chauffeurs_fonction_check CHECK (fonction IN ('titulaire', 'reserve', 'doublon') OR fonction IS NULL);

ALTER TABLE public.chauffeurs 
DROP CONSTRAINT IF EXISTS chauffeurs_base_chauffeur_check,
ADD CONSTRAINT chauffeurs_base_chauffeur_check CHECK (base_chauffeur IN ('conakry', 'kankan', 'nzerekore') OR base_chauffeur IS NULL);

-- Créer la table pour l'historique des changements de statut si elle n'existe pas
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

-- Activer RLS sur la nouvelle table
ALTER TABLE public.chauffeurs_statut_historique ENABLE ROW LEVEL SECURITY;

-- Policies pour l'historique des statuts des chauffeurs
CREATE POLICY "Tous peuvent voir l'historique des statuts" ON public.chauffeurs_statut_historique
  FOR SELECT USING (true);

CREATE POLICY "Tous peuvent créer l'historique des statuts" ON public.chauffeurs_statut_historique
  FOR INSERT WITH CHECK (true);
