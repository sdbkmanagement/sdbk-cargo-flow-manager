DO $$
DECLARE
  target_ids uuid[];
  other_ids uuid[];
  demandes_before bigint;
  deleted_count bigint;
BEGIN
  SELECT array_agg(id) INTO target_ids FROM public.gmao_ordres_travail WHERE numero BETWEEN 'OT-2026-000029' AND 'OT-2026-000074';
  SELECT array_agg(id) INTO other_ids FROM public.gmao_ordres_travail WHERE numero NOT BETWEEN 'OT-2026-000029' AND 'OT-2026-000074';
  SELECT count(*) INTO demandes_before FROM public.gmao_demandes_intervention;
  IF COALESCE(cardinality(target_ids), 0) <> 46 THEN
    RAISE EXCEPTION 'Suppression annulée : les 46 ordres attendus ne sont pas tous présents.';
  END IF;
  -- Delete consumption rows while their orders still exist so stock-return triggers run safely.
  DELETE FROM public.gmao_ot_pieces WHERE ot_id = ANY(target_ids);
  -- Remove stock movements belonging solely to the deleted orders, including generated returns.
  DELETE FROM public.gmao_mouvements_stock WHERE ot_id = ANY(target_ids);
  -- Tasks, checklist results, technicians and order alerts are removed by existing cascades.
  DELETE FROM public.gmao_ordres_travail WHERE id = ANY(target_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 46 THEN RAISE EXCEPTION 'Suppression incomplète : % ordres supprimés.', deleted_count; END IF;
  IF (SELECT count(*) FROM public.gmao_ordres_travail WHERE id = ANY(other_ids)) <> COALESCE(cardinality(other_ids), 0) THEN
    RAISE EXCEPTION 'La conservation des autres ordres a échoué.';
  END IF;
  IF (SELECT count(*) FROM public.gmao_demandes_intervention) <> demandes_before THEN
    RAISE EXCEPTION 'La conservation des demandes a échoué.';
  END IF;
END $$;