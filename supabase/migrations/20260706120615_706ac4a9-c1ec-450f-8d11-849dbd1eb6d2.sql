
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'vehicules','missions','factures','bons_livraison','chauffeurs',
    'non_conformites','diagnostics_maintenance','formations',
    'documents','documents_vehicules','validation_etapes',
    'maintenance_vehicules','themes_formation','fiches_compagnonnage',
    'formations_employes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Dashboard viewer peut lire %I" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Dashboard viewer peut lire %I" ON public.%I FOR SELECT TO authenticated USING (public.current_user_has_role(''dashboard_viewer''::user_role))',
      t, t
    );
  END LOOP;
END $$;
