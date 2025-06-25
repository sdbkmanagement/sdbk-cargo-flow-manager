
-- Ajouter les clés étrangères manquantes pour établir les relations entre les tables
ALTER TABLE public.chargements 
ADD CONSTRAINT chargements_mission_id_fkey 
FOREIGN KEY (mission_id) REFERENCES public.missions(id);

ALTER TABLE public.chargements 
ADD CONSTRAINT chargements_vehicule_id_fkey 
FOREIGN KEY (vehicule_id) REFERENCES public.vehicules(id);

ALTER TABLE public.chargements 
ADD CONSTRAINT chargements_chauffeur_id_fkey 
FOREIGN KEY (chauffeur_id) REFERENCES public.chauffeurs(id);
