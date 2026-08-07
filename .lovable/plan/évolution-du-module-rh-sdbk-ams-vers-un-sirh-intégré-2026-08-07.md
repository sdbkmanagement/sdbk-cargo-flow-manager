# Évolution du module RH SDBK AMS vers un SIRH intégré

Le module RH existant (page RH avec sidebar : Gestion, Temps de travail, Paie, Rapports, Modules) est conservé tel quel. Aucune nouvelle page ni nouveau menu principal : tout est ajouté à l'intérieur de la page RH actuelle, en réutilisant la table `employes` comme référentiel unique.

## Ce qui existe déjà (à réutiliser, pas à recréer)

- `employes` (33 colonnes : identité, matricule, service, poste, fonction, contrat, visite médicale, photo)
- `contrats`, `carrieres`, `sanctions`, `accidents_travail`, `historique_rh`
- `pointages`, `conges`, `absences`, `heures_supplementaires`, `jours_feries`
- Paie complète : `periodes_paie`, `bulletins_paie`, `bulletins_paie_lignes`, `rubriques_paie`, `elements_salaire`, `prets`, `notes_frais`, `config_paie`, `cnss_declarations`
- `evaluations`, `recrutement`, `visites_medicales`, `formations_employes`, `documents`
- Accès protégé par `is_admin_or_rh()` / `has_module_permission(uid,'rh')` et la RPC `get_rh_employes()`

## Travail à réaliser, par lots

### Lot 1 — Fiche collaborateur enrichie (référentiel unique)
- Ajout de colonnes manquantes sur `employes` : département, responsable hiérarchique, société/site, situation familiale, nombre d'enfants, adresse, nationalité, lien contact d'urgence, date de fin de période d'essai, date de départ retraite calculée.
- Refonte de `EmployeDetailDialog` en fiche à onglets : Identité, Professionnel, Documents, Absences/Congés, Formation, Performance, Historique.
- Ancienneté et âge calculés à l'affichage (pas de doublon en base).
- Historique des affectations lu depuis `historique_rh` + `carrieres`.

### Lot 2 — Gestion documentaire RH + alertes d'expiration
- Nouvelle table `documents_rh` (employé, type, numéro, date d'émission, date d'expiration, statut calculé, fichier) + bucket de stockage privé.
- Types : contrat, permis, pièce d'identité, passeport, diplôme, certification, certificat médical.
- Section « Documents » de la sidebar RH (aujourd'hui un placeholder) branchée sur cette table : upload, prévisualisation, statut couleur.
- Statut recalculé par trigger (valide / à renouveler ≤ 30 j / expiré).

### Lot 3 — Tableau de bord RH
- Nouvelle section « Tableau de bord » en tête de la sidebar RH.
- KPI : effectif total/actif, répartition département / fonction / contrat, moyenne d'âge, ancienneté moyenne, absences et congés en cours, contrats à échéance, permis expirants, visites médicales à renouveler, départs retraite, masse salariale du mois.
- Graphiques Recharts (réutilisation du style de `RHDashboardCharts`) + pyramide des âges.
- Filtres : société, site, département, service, période.
- Agrégats servis par une RPC `SECURITY DEFINER` pour éviter les compteurs à zéro dus au RLS.

### Lot 4 — Moteur d'alertes RH
- Table `alertes_rh_config` (type d'alerte, délai en jours, actif) + vue/RPC `get_alertes_rh()` calculant les alertes à la volée depuis les données existantes.
- Familles : documents, permis, contrats, certifications, visites médicales, fin de période d'essai, départ retraite, évaluation à réaliser, formation obligatoire manquante/expirée.
- Affichage : bloc « Alertes » du dashboard RH + intégration dans la cloche de notifications existante de l'en-tête.
- Envoi email : edge function planifiée (digest quotidien) — activée seulement si un fournisseur d'email est configuré.

### Lot 5 — Présences et congés
- Enrichissement des pointages : type de journée (présence, absence, retard, maladie, mission, formation), calcul automatique du temps travaillé, retards et heures supplémentaires.
- Compteurs de congés : table `droits_conges` (droits acquis, consommés, solde) alimentée par les congés validés.
- Workflow de demande : collaborateur → validation manager → validation RH, avec statuts et historique.

### Lot 6 — Paie et masse salariale
- Complément du calcul existant : brut, cotisations salariales, charges patronales, IRG, net, coût employeur (règles Guinée déjà en place).
- Écran de suivi de la masse salariale par mois, année, département et service, avec export.

### Lot 7 — Performance
- Tables `objectifs` (individuel/équipe/département, KPI, échéance, pondération, avancement) et enrichissement d'`evaluations` (type, critères configurables, workflow collaborateur → manager → RH → direction).
- Section « Performance » dans la fiche collaborateur + rapport d'évaluation imprimable.

### Lot 8 — Compétences et talents
- Tables `competences` et `competences_employes` (niveau, certification, expérience).
- Cartographie, analyse des écarts, matrice performance/potentiel, plan de succession et mobilité interne.

### Lot 9 — Formation
- Catalogue de formations (interne, externe, certification, e-learning) réutilisant `formations_employes` et `themes_formation`.
- Suivi par collaborateur : réalisées, prévues, heures, coût, certifications.
- Plan de développement individuel.

### Lot 10 — KPI RH et reporting
- Espace analytique : turnover, absentéisme, masse salariale, coût moyen par collaborateur, âge moyen, ancienneté, effectif par département, budget formation, évolution des compétences.
- Graphiques interactifs, export PDF (jsPDF, déjà présent) et Excel (xlsx, déjà présent).

## Détails techniques

- Toutes les nouvelles tables du schéma `public` reçoivent `GRANT` explicites puis RLS avec des politiques basées sur `is_admin_or_rh(auth.uid())` et `has_module_permission(auth.uid(),'rh')`, comme les tables RH actuelles.
- Aucune route ni entrée de menu principale ajoutée : uniquement de nouvelles entrées dans `RHSidebar` et de nouveaux cas dans le `switch` de `src/pages/RH.tsx`.
- Les statistiques passent par des RPC `SECURITY DEFINER` (règle projet) pour éviter les zéros liés au RLS.
- Les fichiers restent dans Supabase Storage (bucket privé, même approche que les photos employés).
- Les exports utilisent `safeFormatDate` pour éviter les erreurs de date.

## Ordre proposé

Lots 1 → 2 → 3 → 4 d'abord (fiche, documents, dashboard, alertes) : c'est le socle dont dépendent les autres. Puis 5, 6, puis 7 à 10.
