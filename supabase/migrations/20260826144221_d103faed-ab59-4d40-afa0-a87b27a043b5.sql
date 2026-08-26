CREATE OR REPLACE FUNCTION public.add_embauche_to_historique()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.date_embauche IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.historique_rh (employe_id, type_evenement, nouveau_poste, nouveau_service, description, date_evenement)
  VALUES (NEW.id, 'embauche', NEW.poste, NEW.service, 'Embauche - ' || COALESCE(NEW.poste,'') || ' dans le service ' || COALESCE(NEW.service,''), NEW.date_embauche);
  RETURN NEW;
END;
$$;