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
  v_lieu_depart TEXT;
  v_qte NUMERIC;
BEGIN
  v_destination := COALESCE(NEW.lieu_arrivee, NEW.destination);
  IF v_destination IS NULL OR v_destination = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.lieu_arrivee IS NOT DISTINCT FROM OLD.lieu_arrivee
       AND NEW.destination IS NOT DISTINCT FROM OLD.destination
       AND NEW.lieu_depart IS NOT DISTINCT FROM OLD.lieu_depart
       AND NEW.quantite_livree IS NOT DISTINCT FROM OLD.quantite_livree
       AND NEW.quantite_prevue IS NOT DISTINCT FROM OLD.quantite_prevue
       AND NEW.prix_unitaire IS NOT DISTINCT FROM OLD.prix_unitaire THEN
      RETURN NEW;
    END IF;
  END IF;

  v_dest_normalized := lower(replace(replace(v_destination, '-', ' '), '_', ' '));
  v_dest_normalized := regexp_replace(v_dest_normalized, '\s+', ' ', 'g');
  v_dest_normalized := trim(v_dest_normalized);

  v_lieu_depart := COALESCE(NEW.lieu_depart, 'Conakry');

  FOR v_tarif IN SELECT * FROM public.tarifs_hydrocarbures LOOP
    DECLARE
      score INTEGER := 0;
      t_normalized TEXT;
    BEGIN
      t_normalized := lower(replace(replace(v_tarif.destination, '-', ' '), '_', ' '));
      t_normalized := regexp_replace(t_normalized, '\s+', ' ', 'g');
      t_normalized := trim(t_normalized);

      IF v_dest_normalized = t_normalized THEN
        score := 1000;
      ELSIF v_dest_normalized ILIKE '%' || t_normalized || '%' OR t_normalized ILIKE '%' || v_dest_normalized || '%' THEN
        score := 500;
      ELSIF split_part(v_dest_normalized, ' ', 1) = split_part(t_normalized, ' ', 1) AND length(split_part(v_dest_normalized, ' ', 1)) > 2 THEN
        score := 300;
      ELSIF t_normalized ILIKE '%' || split_part(v_dest_normalized, ' ', 1) || '%' AND length(split_part(v_dest_normalized, ' ', 1)) > 3 THEN
        score := 200;
      END IF;

      -- Bonus de spécificité: correspondance plus longue prioritaire (départage entre tarifs de même score de base)
      IF score > 0 THEN
        score := score + length(t_normalized);
      END IF;

      IF score > 0 AND lower(v_tarif.lieu_depart) = lower(v_lieu_depart) THEN
        score := score + 50;
      END IF;

      IF score > v_best_score THEN
        v_best_score := score;
        v_best_tarif := v_tarif;
      END IF;
    END;
  END LOOP;

  IF v_best_score >= 200 THEN
    NEW.prix_unitaire := v_best_tarif.tarif_au_litre;
    v_qte := COALESCE(NEW.quantite_livree, NEW.quantite_prevue, 0);
    NEW.montant_total := v_qte * v_best_tarif.tarif_au_litre;
  ELSIF NEW.prix_unitaire IS NOT NULL AND NEW.prix_unitaire > 0 THEN
    v_qte := COALESCE(NEW.quantite_livree, NEW.quantite_prevue, 0);
    NEW.montant_total := v_qte * NEW.prix_unitaire;
  END IF;

  RETURN NEW;
END;
$function$;