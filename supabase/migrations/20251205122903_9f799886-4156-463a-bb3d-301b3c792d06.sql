-- Permettre aux transitaires de lire les chauffeurs (nécessaire pour créer des missions)
CREATE POLICY "Transitaires peuvent voir les chauffeurs pour missions" 
ON public.chauffeurs 
FOR SELECT 
USING (current_user_has_role('transitaire'::user_role));

-- Permettre aux transitaires de lire les affectations chauffeurs
CREATE POLICY "Transitaires peuvent voir les affectations" 
ON public.affectations_chauffeurs 
FOR SELECT 
USING (current_user_has_role('transitaire'::user_role));