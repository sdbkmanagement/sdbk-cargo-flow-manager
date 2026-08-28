-- 1. L'historique d'embauche ne doit être créé qu'à la création de la fiche
DROP TRIGGER IF EXISTS trigger_employe_historique ON public.employes;

CREATE OR REPLACE FUNCTION public.add_embauche_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.date_embauche IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.historique_rh (employe_id, type_evenement, nouveau_poste, nouveau_service, description, date_evenement)
  VALUES (NEW.id, 'embauche', NEW.poste, NEW.service, 'Embauche - ' || COALESCE(NEW.poste,'') || ' dans le service ' || COALESCE(NEW.service,''), NEW.date_embauche);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_employe_historique
AFTER INSERT ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.add_embauche_to_historique();

-- 2. Nettoyage des doublons d'historique 'embauche' générés par les modifications
DELETE FROM public.historique_rh h
USING public.historique_rh h2
WHERE h.type_evenement = 'embauche'
  AND h2.type_evenement = 'embauche'
  AND h.employe_id = h2.employe_id
  AND h.created_at > h2.created_at;

-- 3. Les utilisateurs ayant l'accès au module RH peuvent modifier les fiches
DROP POLICY IF EXISTS "Module RH peut modifier les employés" ON public.employes;
CREATE POLICY "Module RH peut modifier les employés"
ON public.employes FOR UPDATE TO authenticated
USING (is_admin_or_rh(auth.uid()) OR has_module_permission(auth.uid(), 'rh'))
WITH CHECK (is_admin_or_rh(auth.uid()) OR has_module_permission(auth.uid(), 'rh'));

DROP POLICY IF EXISTS "Module RH peut créer des employés" ON public.employes;
CREATE POLICY "Module RH peut créer des employés"
ON public.employes FOR INSERT TO authenticated
WITH CHECK (is_admin_or_rh(auth.uid()) OR has_module_permission(auth.uid(), 'rh'));