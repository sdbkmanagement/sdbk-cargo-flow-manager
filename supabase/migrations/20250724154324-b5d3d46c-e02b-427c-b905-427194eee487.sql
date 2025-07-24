-- Vider les tables liées aux chauffeurs et véhicules dans le bon ordre

-- Tables liées aux affectations et missions
DELETE FROM public.chargements;
DELETE FROM public.missions;
DELETE FROM public.affectations_chauffeurs;

-- Tables liées aux validations (véhicules)
DELETE FROM public.validation_historique;
DELETE FROM public.validation_etapes;
DELETE FROM public.validation_workflows;

-- Tables liées aux contrôles et diagnostics
DELETE FROM public.controles_obc;
DELETE FROM public.diagnostics_maintenance;

-- Tables de documents
DELETE FROM public.documents WHERE entity_type = 'chauffeur' OR chauffeur_id IS NOT NULL;
DELETE FROM public.documents_chauffeurs;
DELETE FROM public.documents_vehicules;
DELETE FROM public.documents_vehicules_temp;

-- Tables de maintenance
DELETE FROM public.maintenance_vehicules;

-- Tables d'historique
DELETE FROM public.chauffeurs_statut_historique;
DELETE FROM public.missions_historique;
DELETE FROM public.chargements_historique;

-- Tables principales
DELETE FROM public.chauffeurs;
DELETE FROM public.vehicules;