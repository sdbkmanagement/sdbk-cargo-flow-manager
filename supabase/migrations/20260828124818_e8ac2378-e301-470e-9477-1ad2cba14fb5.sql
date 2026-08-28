ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS chauffeur_id uuid REFERENCES public.chauffeurs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero_permis text,
  ADD COLUMN IF NOT EXISTS type_permis text[],
  ADD COLUMN IF NOT EXISTS date_expiration_permis date,
  ADD COLUMN IF NOT EXISTS date_obtention_permis date,
  ADD COLUMN IF NOT EXISTS base_affectation text,
  ADD COLUMN IF NOT EXISTS id_conducteur text;

CREATE UNIQUE INDEX IF NOT EXISTS employes_chauffeur_id_key ON public.employes(chauffeur_id) WHERE chauffeur_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_chauffeur_to_employe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.employes (
      chauffeur_id, nom, prenom, poste, fonction, service, departement, statut, type_contrat,
      matricule, telephone, email, adresse, date_naissance, lieu_naissance, nationalite,
      date_embauche, groupe_sanguin, situation_familiale, immatricule_cnss, photo_url,
      numero_permis, type_permis, date_expiration_permis, date_obtention_permis,
      base_affectation, id_conducteur, personne_urgence, telephone_urgence
    ) VALUES (
      NEW.id, NEW.nom, NEW.prenom, COALESCE(NEW.fonction, 'Chauffeur'), COALESCE(NEW.fonction, 'Chauffeur'),
      'Chauffeurs', 'Exploitation',
      CASE WHEN NEW.statut = 'actif' THEN 'actif' ELSE 'inactif' END,
      COALESCE(NEW.type_contrat, 'CDI'),
      NEW.matricule, NEW.telephone, NEW.email, NEW.adresse, NEW.date_naissance, NEW.lieu_naissance,
      NEW.nationalite, NEW.date_embauche, NEW.groupe_sanguin, NEW.statut_matrimonial,
      NEW.immatricule_cnss, NEW.photo_url, NEW.numero_permis, NEW.type_permis,
      NEW.date_expiration_permis, NEW.date_obtention_permis, NEW.base_chauffeur, NEW.id_conducteur,
      NULLIF(TRIM(COALESCE(NEW.urgence_prenom,'') || ' ' || COALESCE(NEW.urgence_nom,'')), ''),
      NEW.urgence_telephone
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.employes SET
      nom = NEW.nom, prenom = NEW.prenom, telephone = NEW.telephone, email = NEW.email,
      photo_url = NEW.photo_url, matricule = NEW.matricule,
      numero_permis = NEW.numero_permis, type_permis = NEW.type_permis,
      date_expiration_permis = NEW.date_expiration_permis,
      date_obtention_permis = NEW.date_obtention_permis,
      base_affectation = NEW.base_chauffeur, id_conducteur = NEW.id_conducteur,
      updated_at = now()
    WHERE chauffeur_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_chauffeur_to_employe ON public.chauffeurs;
CREATE TRIGGER trg_sync_chauffeur_to_employe
AFTER INSERT OR UPDATE ON public.chauffeurs
FOR EACH ROW EXECUTE FUNCTION public.sync_chauffeur_to_employe();