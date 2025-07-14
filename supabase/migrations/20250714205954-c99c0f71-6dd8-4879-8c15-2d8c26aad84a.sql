
-- Créer la table pour les tarifs hydrocarbures
CREATE TABLE public.tarifs_hydrocarbures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ordre INTEGER NOT NULL DEFAULT 1,
  lieu_depart VARCHAR NOT NULL,
  destination VARCHAR NOT NULL,
  tarif_au_litre DECIMAL(10,2) NOT NULL,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter des politiques RLS
ALTER TABLE public.tarifs_hydrocarbures ENABLE ROW LEVEL SECURITY;

-- Permettre à tous les utilisateurs authentifiés de voir les tarifs
CREATE POLICY "Tous peuvent voir les tarifs hydrocarbures" 
  ON public.tarifs_hydrocarbures 
  FOR SELECT 
  USING (true);

-- Permettre aux utilisateurs autorisés de créer des tarifs
CREATE POLICY "Utilisateurs autorisés peuvent créer des tarifs" 
  ON public.tarifs_hydrocarbures 
  FOR INSERT 
  WITH CHECK (true);

-- Permettre aux utilisateurs autorisés de modifier des tarifs
CREATE POLICY "Utilisateurs autorisés peuvent modifier des tarifs" 
  ON public.tarifs_hydrocarbures 
  FOR UPDATE 
  USING (true);

-- Permettre aux utilisateurs autorisés de supprimer des tarifs
CREATE POLICY "Utilisateurs autorisés peuvent supprimer des tarifs" 
  ON public.tarifs_hydrocarbures 
  FOR DELETE 
  USING (true);

-- Ajouter un trigger pour mettre à jour updated_at
CREATE TRIGGER update_tarifs_hydrocarbures_updated_at
  BEFORE UPDATE ON public.tarifs_hydrocarbures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer quelques données d'exemple
INSERT INTO public.tarifs_hydrocarbures (numero_ordre, lieu_depart, destination, tarif_au_litre, observations) VALUES
(1, 'Conakry', 'Kindia', 12500.00, 'Tarif standard'),
(2, 'Conakry', 'Mamou', 15000.00, 'Route en bon état'),
(3, 'Conakry', 'Dalaba', 18000.00, 'Route montueuse'),
(1, 'Kankan', 'Siguiri', 14000.00, 'Tarif standard'),
(2, 'Kankan', 'Kouroussa', 11000.00, 'Route directe'),
(1, 'N''Zerekore', 'Macenta', 13500.00, 'Tarif standard'),
(2, 'N''Zerekore', 'Gueckedou', 16000.00, 'Route difficile');
