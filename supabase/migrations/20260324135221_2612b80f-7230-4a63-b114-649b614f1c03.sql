-- Fonction pour calculer automatiquement le prix d'un BL à la création
CREATE OR REPLACE FUNCTION public.calculer_prix_bl_auto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_destination TEXT;
  v_tarif RECORD;
  v_best_score INTEGER := 0;
  v_best_tarif RECORD;
  v_dest_normalized TEXT;
  v_tarif_normalized TEXT;
  v_lieu_depart TEXT;
BEGIN
  -- Ne calculer que si pas déjà renseigné
  IF NEW.prix_unitaire IS NOT NULL AND NEW.prix_unitaire > 0 THEN
    RETURN NEW;
  END IF;

  -- Déterminer la destination à utiliser
  v_destination := COALESCE(NEW.lieu_arrivee, NEW.destination);
  IF v_destination IS NULL OR v_destination = '' THEN
    RETURN NEW;
  END IF;

  -- Normaliser la destination
  v_dest_normalized := lower(replace(replace(v_destination, '-', ' '), '_', ' '));
  v_dest_normalized := regexp_replace(v_dest_normalized, '\s+', ' ', 'g');
  v_dest_normalized := trim(v_dest_normalized);

  v_lieu_depart := COALESCE(NEW.lieu_depart, 'Conakry');

  -- Chercher le meilleur tarif correspondant
  FOR v_tarif IN SELECT * FROM public.tarifs_hydrocarbures LOOP
    DECLARE
      score INTEGER := 0;
      t_normalized TEXT;
    BEGIN
      t_normalized := lower(replace(replace(v_tarif.destination, '-', ' '), '_', ' '));
      t_normalized := regexp_replace(t_normalized, '\s+', ' ', 'g');
      t_normalized := trim(t_normalized);

      -- Correspondance exacte
      IF v_dest_normalized = t_normalized THEN
        score := 1000;
      -- L'un contient l'autre
      ELSIF v_dest_normalized ILIKE '%' || t_normalized || '%' OR t_normalized ILIKE '%' || v_dest_normalized || '%' THEN
        score := 500;
      -- Premier mot en commun
      ELSIF split_part(v_dest_normalized, ' ', 1) = split_part(t_normalized, ' ', 1) AND length(split_part(v_dest_normalized, ' ', 1)) > 2 THEN
        score := 300;
      -- Le premier mot de la destination est contenu dans le tarif
      ELSIF t_normalized ILIKE '%' || split_part(v_dest_normalized, ' ', 1) || '%' AND length(split_part(v_dest_normalized, ' ', 1)) > 3 THEN
        score := 200;
      END IF;

      -- Bonus si même lieu de départ
      IF score > 0 AND lower(v_tarif.lieu_depart) = lower(v_lieu_depart) THEN
        score := score + 50;
      END IF;

      IF score > v_best_score THEN
        v_best_score := score;
        v_best_tarif := v_tarif;
      END IF;
    END;
  END LOOP;

  -- Appliquer le tarif si trouvé
  IF v_best_score >= 200 THEN
    NEW.prix_unitaire := v_best_tarif.tarif_au_litre;
    NEW.montant_total := COALESCE(NEW.quantite_livree, NEW.quantite_prevue, 0) * v_best_tarif.tarif_au_litre;
  END IF;

  RETURN NEW;
END;
$function$;

-- Créer le trigger sur INSERT
CREATE TRIGGER trigger_calculer_prix_bl_auto
  BEFORE INSERT ON public.bons_livraison
  FOR EACH ROW
  EXECUTE FUNCTION public.calculer_prix_bl_auto();
