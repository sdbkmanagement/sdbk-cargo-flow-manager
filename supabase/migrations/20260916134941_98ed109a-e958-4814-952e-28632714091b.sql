ALTER TABLE public.bulletins_paie
  ADD COLUMN IF NOT EXISTS prime_transport numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_logement numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prime_cherete_vie numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autres_primes numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_rts numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rts numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avance_salaire numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manquant numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complement_mois_precedent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onfpp numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS versement_forfaitaire numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_charges_patronales numeric DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS config_paie_cle_key ON public.config_paie (cle);

INSERT INTO public.config_paie (cle, valeur, description, categorie) VALUES
  ('plafond_cnss', '2500000', 'Plafond mensuel de la base CNSS (GNF)', 'cnss'),
  ('taux_cnss_salarial', '5', 'Taux CNSS part salariale (%)', 'cnss'),
  ('taux_cnss_patronal', '18', 'Taux CNSS part patronale (%)', 'cnss'),
  ('taux_onfpp', '1.5', 'Taux ONFPP appliqué au salaire brut (%)', 'charges'),
  ('taux_vf', '6', 'Taux du versement forfaitaire (%)', 'charges'),
  ('abattement_vf', '150000', 'Abattement mensuel appliqué avant le versement forfaitaire (GNF)', 'charges'),
  ('bareme_rts', '[{"plafond":1000000,"taux":0},{"plafond":3000000,"taux":5},{"plafond":5000000,"taux":8},{"plafond":10000000,"taux":10},{"plafond":20000000,"taux":15},{"plafond":null,"taux":20}]', 'Barème RTS par tranches (plafond en GNF, taux en %)', 'rts')
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, description = EXCLUDED.description, categorie = EXCLUDED.categorie;

INSERT INTO public.periodes_paie (mois, annee, date_debut, date_fin, statut)
SELECT 8, 2026, '2026-08-01', '2026-08-31', 'ouverte'
WHERE NOT EXISTS (SELECT 1 FROM public.periodes_paie WHERE mois = 8 AND annee = 2026);