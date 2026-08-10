# Module GMAO / Maintenance pour SDBK AMS

Ajout d'un nouveau module `Maintenance / GMAO` accessible depuis le menu principal, sans toucher aux modules existants (Flotte, HSEQ, RH, Facturation restent inchangés).

## Principe de réutilisation

- Les véhicules restent dans `vehicules` : les équipements roulants ne sont pas dupliqués, la table `equipements` référence optionnellement un `vehicule_id`.
- Les techniciens s'appuient sur `employes` (référence `employe_id`) + une table de spécialités/disponibilité.
- Les fournisseurs : pas de table fournisseur générique aujourd'hui, on crée `gmao_fournisseurs` (garages/prestataires) réutilisable ensuite.
- Les anomalies HSEQ (`non_conformites`) peuvent générer une demande d'intervention (lien `source_nc_id`).
- Les rôles existants sont réutilisés : `admin`, `maintenance`, `direction`, `hsecq`, `transport`. Nouveau module de permission `gmao` ajouté à la matrice des rôles.

## Livraison en 4 lots

### Lot 1 — Socle base de données + navigation
Tables (préfixe `gmao_` pour éviter tout conflit) :

```text
gmao_categories_equipement      gmao_equipements
gmao_plans_maintenance          gmao_checklists / gmao_checklist_items
gmao_demandes_intervention      gmao_ordres_travail
gmao_ot_taches                  gmao_ot_checklist_resultats
gmao_techniciens                gmao_ot_techniciens
gmao_pieces                     gmao_mouvements_stock
gmao_ot_pieces                  gmao_fournisseurs
gmao_contrats                   gmao_couts
gmao_alertes                    gmao_historique_equipement
gmao_audit_logs                 gmao_pieces_jointes
```

Règles automatiques en base (triggers) :
- Numérotation unique : `DI-2026-000125`, `OT-2026-000087`, code équipement.
- Consommation de pièce sur un OT → décrément du stock + mouvement + alerte si sous le seuil mini.
- Calcul automatique du coût total d'un OT (pièces + main-d'œuvre + prestation + autres).
- Statut équipement passé à `en_maintenance` à l'ouverture d'un OT, `operationnel` à la clôture, avec calcul de la durée d'immobilisation.
- Calcul de la prochaine échéance d'un plan préventif (date / km / heures) et alerte avant échéance.
- Journal d'audit sur créations, modifications, changements de statut, clôtures, mouvements de stock.
- RLS + GRANT sur chaque table, alignés sur les rôles ci-dessus.

Frontend du lot 1 : entrée `Maintenance / GMAO` dans le hub et la sidebar, page `/gmao` avec navigation latérale interne (comme le module RH), permission `gmao` ajoutée à la matrice des rôles.

### Lot 2 — Parc, préventif, check-lists
- Liste et fiche équipement à onglets : Informations | Maintenance | Interventions | Pièces | Coûts | Documents | Historique.
- Import des véhicules existants comme équipements (liaison, pas de copie).
- Plans de maintenance préventive (déclencheur date / jours / km / heures / compteur), opérations, pièces prévues, coût estimé, prochaine échéance.
- Éditeur de check-lists réutilisables ; saisie Conforme / Non conforme / Non applicable avec commentaire et photo.

### Lot 3 — Flux opérationnel complet
- Déclaration de panne (priorité, photos, pièces jointes) et demandes d'intervention avec workflow accepter / rejeter / demander info / transformer en OT.
- Ordres de travail : planification, affectation technicien(s), diagnostic, travaux, pièces consommées, main-d'œuvre, prestataire, photos avant/après, contrôle puis clôture verrouillée (modification post-clôture tracée).
- Pièces & stock : fiches pièces, mouvements (entrée, sortie, retour, ajustement, transfert), alertes seuil.
- Fournisseurs / prestataires et contrats de maintenance avec alertes d'échéance.
- Techniciens : fiche, compétences, disponibilité, historique et performance.

### Lot 4 — Pilotage
- Dashboard GMAO temps réel : tous les compteurs demandés, graphiques (coûts par mois, préventif vs correctif, pannes par mois, coûts par équipement, top 10 coûts, top 10 pannes, évolution de la disponibilité), filtres période / site / département / type / véhicule / statut / type de maintenance.
- KPI calculés sur données réelles : MTTR, MTBF, disponibilité, taux préventif/correctif, coût moyen, respect du planning.
- Centre d'alertes GMAO (dashboard, notifications, fiches concernées).
- Rapports (interventions, pannes, préventif, correctif, coûts, pièces, immobilisation, disponibilité, par véhicule / équipement / technicien / fournisseur) avec export PDF, Excel, CSV via les utilitaires d'export déjà présents.
- Recherche globale GMAO (code équipement, immatriculation, n° série, n° OT, n° demande, référence pièce, fournisseur, technicien).

## Détails techniques

- Services : `src/services/gmao/*.ts` (equipements, preventif, demandes, ordresTravail, pieces, fournisseurs, contrats, dashboard, rapports), pagination récursive comme les services existants.
- UI : `src/pages/GMAO.tsx` + `src/components/gmao/**`, composants shadcn et tokens de design déjà en place, responsive mobile/tablette.
- Aucune modification destructive : les tables `maintenance_vehicules` et `diagnostics_maintenance` actuelles restent en place et sont affichées dans l'historique de l'équipement lié.
- Aucune donnée fictive : tous les indicateurs proviennent des tables réelles.

## Ce que je fais après validation

Je commence par le lot 1 (migration base de données + navigation + permissions), puis j'enchaîne les lots 2 à 4.
