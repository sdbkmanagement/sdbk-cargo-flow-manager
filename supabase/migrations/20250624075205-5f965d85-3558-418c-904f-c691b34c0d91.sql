
-- Créer une table pour les workflows de validation des véhicules
CREATE TABLE public.validation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID NOT NULL REFERENCES public.vehicules(id) ON DELETE CASCADE,
  statut_global VARCHAR(50) NOT NULL DEFAULT 'en_validation' CHECK (statut_global IN ('en_validation', 'valide', 'rejete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicule_id)
);

-- Créer une table pour les étapes de validation
CREATE TABLE public.validation_etapes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.validation_workflows(id) ON DELETE CASCADE,
  etape VARCHAR(50) NOT NULL CHECK (etape IN ('maintenance', 'administratif', 'hsecq', 'obc')),
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  commentaire TEXT,
  validateur_nom VARCHAR(255),
  validateur_role VARCHAR(50),
  date_validation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, etape)
);

-- Créer une table pour l'historique des validations
CREATE TABLE public.validation_historique (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.validation_workflows(id) ON DELETE CASCADE,
  etape VARCHAR(50) NOT NULL,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50) NOT NULL,
  commentaire TEXT,
  validateur_nom VARCHAR(255),
  validateur_role VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_validation_workflows_vehicule_id ON public.validation_workflows(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_validation_etapes_workflow_id ON public.validation_etapes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_validation_etapes_etape ON public.validation_etapes(etape);
CREATE INDEX IF NOT EXISTS idx_validation_historique_workflow_id ON public.validation_historique(workflow_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_validation_workflows_updated_at 
  BEFORE UPDATE ON public.validation_workflows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validation_etapes_updated_at 
  BEFORE UPDATE ON public.validation_etapes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function pour créer automatiquement les 4 étapes lors de la création d'un workflow
CREATE OR REPLACE FUNCTION public.create_validation_etapes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.validation_etapes (workflow_id, etape) VALUES
    (NEW.id, 'maintenance'),
    (NEW.id, 'administratif'),
    (NEW.id, 'hsecq'),
    (NEW.id, 'obc');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les étapes
CREATE TRIGGER create_etapes_after_workflow_insert
  AFTER INSERT ON public.validation_workflows
  FOR EACH ROW EXECUTE FUNCTION create_validation_etapes();

-- Function pour mettre à jour le statut global du workflow
CREATE OR REPLACE FUNCTION public.update_workflow_statut()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  valides_count INTEGER;
  rejetes_count INTEGER;
  nouveau_statut VARCHAR(50);
BEGIN
  -- Récupérer le workflow_id
  SELECT workflow_id INTO workflow_record FROM public.validation_etapes WHERE id = NEW.id;
  
  -- Compter les statuts
  SELECT 
    COUNT(CASE WHEN statut = 'valide' THEN 1 END),
    COUNT(CASE WHEN statut = 'rejete' THEN 1 END)
  INTO valides_count, rejetes_count
  FROM public.validation_etapes 
  WHERE workflow_id = workflow_record.workflow_id;
  
  -- Déterminer le nouveau statut global
  IF rejetes_count > 0 THEN
    nouveau_statut := 'rejete';
  ELSIF valides_count = 4 THEN
    nouveau_statut := 'valide';
  ELSE
    nouveau_statut := 'en_validation';
  END IF;
  
  -- Mettre à jour le workflow
  UPDATE public.validation_workflows 
  SET statut_global = nouveau_statut, updated_at = now()
  WHERE id = workflow_record.workflow_id;
  
  -- Mettre à jour le statut du véhicule
  UPDATE public.vehicules 
  SET statut = CASE 
    WHEN nouveau_statut = 'valide' THEN 'disponible'
    WHEN nouveau_statut = 'rejete' THEN 'validation_requise'
    ELSE 'validation_requise'
  END,
  updated_at = now()
  WHERE id = (SELECT vehicule_id FROM public.validation_workflows WHERE id = workflow_record.workflow_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut global
CREATE TRIGGER update_statut_after_etape_change
  AFTER UPDATE ON public.validation_etapes
  FOR EACH ROW EXECUTE FUNCTION update_workflow_statut();

-- Policies RLS (permissives pour le moment)
ALTER TABLE public.validation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_etapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on validation_workflows" 
  ON public.validation_workflows FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on validation_etapes" 
  ON public.validation_etapes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on validation_historique" 
  ON public.validation_historique FOR ALL USING (true) WITH CHECK (true);
