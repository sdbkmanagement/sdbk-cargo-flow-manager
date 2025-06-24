
# 📚 TUTORIEL COMPLET - SDBK CARGO FLOW MANAGER

## 🎯 PRÉSENTATION GÉNÉRALE

SDBK Cargo Flow Manager est une solution complète de gestion de flotte et de transport conçue spécialement pour SDBK Cargo. Le logiciel permet de gérer l'ensemble des opérations de transport, de la gestion des véhicules et chauffeurs jusqu'à la planification des missions et la facturation.

---

## 🚀 PREMIERS PAS

### Accès à l'Application
1. Ouvrez votre navigateur web
2. Accédez à l'URL de l'application
3. L'application s'ouvre directement (pas d'authentification requise pour cette version de démonstration)

### Navigation Principale
La barre latérale gauche contient les modules principaux :
- **🏠 Accueil** : Vue d'ensemble et tableau de bord
- **📊 Dashboard** : Statistiques et indicateurs clés
- **👨‍💼 Chauffeurs** : Gestion du personnel de conduite
- **🚛 Flotte** : Gestion des véhicules
- **🗓️ Missions** : Planification et suivi des missions
- **💰 Facturation** : Gestion commerciale et financière

---

## 📊 MODULE DASHBOARD

### Accès
Cliquez sur **"Dashboard"** dans le menu latéral.

### Fonctionnalités
Le tableau de bord présente une vue d'ensemble avec :

#### 📈 Indicateurs Clés
- **Véhicules actifs** : Nombre de véhicules opérationnels
- **Chauffeurs disponibles** : Personnel prêt pour les missions
- **Missions en cours** : Transports en cours de réalisation
- **Validations en attente** : Actions requises
- **Chiffre d'affaires mensuel** : Performance financière
- **Taux de conformité** : Niveau de qualité

#### 🔔 Activité Récente
- Dernières actions dans le système
- Historique des missions terminées
- Validations effectuées

#### ⚠️ Alertes Importantes
- Maintenances urgentes
- Documents expirés
- Validations en attente

### Comment Utiliser
1. Consultez les indicateurs pour avoir une vue globale
2. Vérifiez les alertes importantes
3. Suivez l'activité récente pour rester informé

---

## 👨‍💼 MODULE CHAUFFEURS

### Accès
Cliquez sur **"Chauffeurs"** dans le menu latéral.

### Vue d'Ensemble
Le module affiche des statistiques en temps réel :
- **Total chauffeurs** : Effectif global
- **Chauffeurs actifs** : Personnel opérationnel
- **Chauffeurs inactifs** : Personnel non disponible
- **Alertes documents** : Permis et documents à renouveler

### Onglet "Liste des Chauffeurs"

#### Fonctionnalités de Recherche
- **Barre de recherche** : Tapez le nom, prénom ou téléphone
- **Bouton Filtres** : Options de tri avancées

#### Actions Disponibles
- **Voir les détails** : Clic sur un chauffeur pour voir sa fiche complète
- **Modifier** : Édition des informations (si autorisé)

#### Informations Affichées
- Photo du chauffeur
- Nom, prénom
- Téléphone
- Type de permis
- Statut (Actif/Inactif)
- Date d'expiration du permis

### Onglet "Alertes Documents"
- Liste des chauffeurs avec documents proches de l'expiration
- Tri par urgence (rouge = expiré, orange = expire bientôt)

### Onglet "Planning"
- Vue calendrier des missions par chauffeur
- Planification des missions
- Gestion des emplois du temps

### Onglet "Nouveau Chauffeur"

#### Étape 1 : Informations Personnelles
- **Nom** et **Prénom** (obligatoires)
- **Date de naissance**
- **Téléphone** (obligatoire)
- **Email**
- **Adresse complète**

#### Étape 2 : Permis de Conduire
- **Numéro de permis** (obligatoire)
- **Type de permis** : Sélection multiple possible
  - B : Véhicules légers
  - C : Poids lourds
  - CE : Poids lourds avec remorque
  - D : Transport de personnes
- **Date d'expiration** (obligatoire)

#### Étape 3 : Documents
- **Upload de documents** : Permis, formation, etc.
- **Formats acceptés** : PDF, JPG, PNG
- **Taille maximum** : 5 MB par fichier

#### Étape 4 : Photo et Signature
- **Photo du chauffeur** : Pour identification
- **Signature numérisée** : Pour les documents officiels

### Comment Tester
1. **Consulter la liste** : Naviguez dans la liste des chauffeurs
2. **Rechercher** : Utilisez la barre de recherche
3. **Voir les détails** : Cliquez sur un chauffeur
4. **Créer un nouveau chauffeur** : 
   - Cliquez sur "Nouveau chauffeur"
   - Remplissez toutes les étapes
   - Validez la création

---

## 🚛 MODULE FLOTTE

### Accès
Cliquez sur **"Flotte"** dans le menu latéral.

### Vue d'Ensemble
Statistiques de la flotte :
- **Total véhicules**
- **Véhicules disponibles**
- **En mission**
- **En maintenance**
- **Transport hydrocarbures/bauxite**
- **Maintenances urgentes**

### Onglet "Liste des Véhicules"

#### Informations Affichées
- **Numéro** du véhicule
- **Immatriculation**
- **Marque et modèle**
- **Type de transport** (Hydrocarbures/Bauxite)
- **Statut** (Disponible/En mission/Maintenance)
- **Chauffeur assigné**
- **Prochaine maintenance**

#### Actions Disponibles
- **Voir détails** : Fiche complète du véhicule
- **Modifier** : Édition des informations
- **Supprimer** : Retrait du parc

### Onglet "Maintenance"
- **Historique de maintenance** par véhicule
- **Planification** des maintenances préventives
- **Alertes** pour les maintenances dues

### Onglet "Validation"
- **Workflow de validation** en 4 étapes :
  1. **Maintenance** : Validation technique
  2. **Administratif** : Contrôle des documents
  3. **HSECQ** : Validation sécurité/qualité/environnement
  4. **OBC** : Validation opérationnelle finale

#### Processus de Validation
- Chaque étape peut être **validée** ou **rejetée**
- **Commentaires obligatoires** en cas de rejet
- **Historique complet** des validations
- **Statut global** mis à jour automatiquement

### Création d'un Nouveau Véhicule

#### Informations de Base
- **Numéro** (auto-généré ou manuel)
- **Marque** et **Modèle**
- **Immatriculation**
- **Année de fabrication**
- **Numéro de chassis**

#### Spécifications Techniques
- **Type de transport** : Hydrocarbures ou Bauxite
- **Capacité maximale** (en tonnes)
- **Consommation moyenne** (L/100km)

#### Maintenance
- **Kilométrage actuel**
- **Date dernière maintenance**
- **Prochaine maintenance prévue**

#### Documents
- **Upload de documents** : Carte grise, assurance, contrôle technique
- **Suivi des dates d'expiration**

### Comment Tester
1. **Consulter la flotte** : Parcourez la liste des véhicules
2. **Créer un véhicule** : 
   - Cliquez sur "Nouveau véhicule"
   - Remplissez tous les champs
   - Uploadez des documents tests
3. **Tester la validation** :
   - Allez dans l'onglet "Validation"
   - Validez ou rejetez chaque étape
   - Observez les changements de statut

---

## 🗓️ MODULE MISSIONS

### Accès
Cliquez sur **"Missions"** dans le menu latéral.

### Vue d'Ensemble
Statistiques en temps réel :
- **Total missions**
- **Missions aujourd'hui**
- **En attente**
- **En cours**
- **Terminées**
- **Annulées**

### Fonctionnalités de Recherche et Filtrage
- **Recherche globale** : Numéro, véhicule, chauffeur, lieu
- **Filtre par statut** : En attente, En cours, Terminée, Annulée
- **Filtre par type** : Hydrocarbures, Bauxite

### Liste des Missions

#### Informations Affichées
- **Numéro de mission** (auto-généré : M2024-XXX-XXX)
- **Type de transport**
- **Véhicule assigné**
- **Chauffeur assigné**
- **Trajet** : Site de départ → Site d'arrivée
- **Date et heure de départ**
- **Statut** avec badge coloré
- **Volume/Poids**

#### Actions Disponibles
- **Voir détails** : Informations complètes
- **Modifier** : Édition de la mission
- **Changer statut** : Progression du workflow

### Création d'une Nouvelle Mission

#### Informations Générales
- **Type de transport** : Hydrocarbures ou Bauxite
- **Site de départ** (obligatoire)
- **Site d'arrivée** (obligatoire)

#### Ressources
- **Véhicule** : Liste filtrée des véhicules disponibles uniquement
- **Chauffeur** : Liste filtrée des chauffeurs actifs uniquement
- **Vérification automatique** de la disponibilité

#### Planning
- **Date et heure de départ** (obligatoire)
- **Date et heure d'arrivée prévue** (obligatoire)
- **Contrôle des conflits** automatique

#### Chargement
- **Volume ou poids** à transporter
- **Unité de mesure** (tonnes par défaut)

#### Observations
- **Champ libre** pour instructions spéciales

### Vérifications Automatiques
Le système vérifie automatiquement :
- **Disponibilité du véhicule** (statut "disponible")
- **Disponibilité du chauffeur** (statut "actif")
- **Conflits de planning** (pas de chevauchement)

### Comment Tester
1. **Consulter les missions** : Parcourez la liste
2. **Utiliser les filtres** : Testez les différents filtres
3. **Créer une mission** :
   - Cliquez sur "Nouvelle mission"
   - Sélectionnez un type de transport
   - Choisissez un véhicule et un chauffeur
   - Définissez le trajet et les horaires
   - Sauvegardez
4. **Modifier une mission** : Cliquez sur une mission existante
5. **Tester les conflits** : Essayez de créer deux missions avec les mêmes ressources

---

## 💰 MODULE FACTURATION

### Accès
Cliquez sur **"Facturation"** dans le menu latéral.

### Onglet "Tableau de Bord"

#### Métriques Financières
- **Chiffre d'affaires mensuel**
- **Factures en attente**
- **Factures en retard**
- **Factures réglées**
- **Total des devis**

#### Graphiques
- **Évolution du CA** par mois
- **Répartition par statut** des factures

### Onglet "Factures"

#### Liste des Factures
- **Numéro** (auto-généré)
- **Client** et société
- **Date d'émission**
- **Montant TTC**
- **Statut** (En attente/Payée/En retard)
- **Actions** : Voir, Modifier, Télécharger PDF, Supprimer

#### Création d'une Facture
1. **Informations client** :
   - Nom, société, contact
   - Email pour l'envoi
2. **Détails mission** :
   - Numéro de mission (optionnel)
   - Type de transport
   - Véhicule et chauffeur
3. **Lignes de facturation** :
   - Description du service
   - Quantité
   - Prix unitaire HT
   - Total calculé automatiquement
4. **Calculs automatiques** :
   - Sous-total HT
   - TVA (20%)
   - Total TTC

### Onglet "Devis"

#### Création d'un Devis
- **Processus similaire** aux factures
- **Validation** : En attente → Accepté → Facturé
- **Conversion** : Devis accepté → Facture automatique

### Onglet "Suivi Paiements"
- **État des paiements** par client
- **Relances automatiques**
- **Historique des règlements**

### Fonctionnalités Avancées
- **Export Excel** : Toutes les données
- **Génération PDF** : Factures et devis professionnels
- **Recherche** : Par client, numéro, montant
- **Filtrage** : Par statut, période

### Comment Tester
1. **Consulter le tableau de bord** : Observez les métriques
2. **Créer un client** (si nécessaire)
3. **Créer une facture** :
   - Cliquez sur "Nouvelle facture"
   - Remplissez les informations client
   - Ajoutez des lignes de facturation
   - Vérifiez les calculs automatiques
   - Sauvegardez
4. **Télécharger un PDF** : Testez la génération de documents
5. **Créer un devis** : Processus similaire aux factures

---

## 🔧 CONSEILS D'UTILISATION

### Workflow Recommandé
1. **Démarrez par les Chauffeurs** : Créez votre équipe
2. **Ajoutez les Véhicules** : Constituez votre flotte
3. **Validez les Véhicules** : Passez par le workflow de validation
4. **Planifiez les Missions** : Assignez ressources et plannings
5. **Facturez les Prestations** : Générez la facturation

### Bonnes Pratiques
- **Tenez à jour** les statuts des chauffeurs et véhicules
- **Vérifiez régulièrement** les dates d'expiration des documents
- **Utilisez les filtres** pour naviguer efficacement
- **Consultez le Dashboard** pour une vue d'ensemble

### Gestion des Permissions
Dans la version complète, différents rôles auront des accès spécifiques :
- **Transport** : Gestion missions et ressources
- **Direction** : Consultation et validation
- **Admin** : Accès complet

---

## 🐛 RÉSOLUTION DE PROBLÈMES

### Problèmes Courants

#### "Véhicule non disponible"
- Vérifiez le statut du véhicule dans la flotte
- Assurez-vous qu'il a passé la validation complète

#### "Chauffeur non actif"
- Contrôlez le statut dans la gestion des chauffeurs
- Vérifiez les dates d'expiration des permis

#### "Conflit de planning"
- Consultez les missions existantes
- Vérifiez les créneaux horaires

### Support Technique
- Consultez les **logs de console** du navigateur pour les erreurs techniques
- Vérifiez la **connexion internet** pour les problèmes de chargement
- **Rafraîchissez la page** en cas de comportement inattendu

---

## 📈 PROCHAINES FONCTIONNALITÉS

### En Développement
- **Authentification avancée** avec rôles utilisateurs
- **Notifications en temps réel**
- **Tableau de bord analytique** avancé
- **Intégration GPS** pour le suivi des missions
- **API mobile** pour les chauffeurs

### Modules Futurs
- **Gestion du carburant**
- **Contrôle qualité** avancé
- **Reporting automatisé**
- **Intégrations tierces** (comptabilité, etc.)

---

## 📞 CONTACT ET FEEDBACK

Pour toute question ou suggestion d'amélioration concernant SDBK Cargo Flow Manager, n'hésitez pas à nous contacter. Vos retours sont précieux pour l'évolution du logiciel.

**Version du tutoriel** : 1.0  
**Date de mise à jour** : 24 Juin 2025  
**Logiciel** : SDBK Cargo Flow Manager

---

*Ce tutoriel couvre toutes les fonctionnalités actuellement implémentées. Le logiciel évolue constamment pour répondre aux besoins spécifiques de SDBK Cargo.*
