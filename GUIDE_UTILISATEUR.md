# 📋 Guide Utilisateur - Système de Gestion de Transport

## 🎯 Vue d'ensemble

Ce système de gestion de transport est une application complète qui permet de gérer tous les aspects d'une entreprise de transport : véhicules, chauffeurs, missions, facturation, ressources humaines et administration.

## 🔐 Connexion et Authentification

### Première connexion
1. Rendez-vous sur la page de connexion
2. Saisissez votre email et mot de passe fournis par l'administrateur
3. Vous serez dirigé vers le tableau de bord principal

### Rôles et Permissions
Le système utilise différents rôles avec des permissions spécifiques :

- **Admin** : Accès complet à toutes les fonctionnalités
- **Direction** : Vue d'ensemble et rapports
- **Transport** : Gestion des missions et véhicules
- **Maintenance** : Gestion de l'entretien des véhicules
- **Administratif** : Gestion des documents et validation
- **RH** : Gestion des employés et chauffeurs
- **Facturation** : Gestion des factures et devis
- **HSECQ** : Hygiène, Sécurité, Environnement, Qualité
- **OBC** : Opérations de Base Chantier

---

## 🏠 Tableau de Bord

Le tableau de bord principal vous donne une vue d'ensemble de votre activité :

### Statistiques Générales
- **Véhicules** : Nombre total, disponibles, en mission, en maintenance
- **Chauffeurs** : Nombre actif, en mission, disponibles
- **Missions** : En cours, terminées, planifiées
- **Chargements** : Statut et volume
- **Finances** : Chiffre d'affaires, factures en attente

### Alertes et Notifications
- Documents expirés ou proches de l'expiration
- Véhicules nécessitant une maintenance
- Missions urgentes
- Formations obligatoires échues

---

## 🚛 Module Flotte

### Gestion des Véhicules

#### Ajouter un Véhicule
1. Accédez à **Flotte** > **Liste des véhicules**
2. Cliquez sur **+ Ajouter un véhicule**
3. Remplissez les informations :
   - **Informations générales** : Numéro, type, immatriculation
   - **Spécifications** : Marque, modèle, année, capacité
   - **Opérationnel** : Base d'affectation, chauffeur assigné
   - **Documents** : Upload des papiers du véhicule

#### Types de Véhicules
- **Porteur** : Camion simple
- **Tracteur + Remorque** : Ensemble routier
- **Utilitaire** : Petit véhicule de livraison

#### Statuts des Véhicules
- **Disponible** : Prêt pour une mission
- **En mission** : Actuellement en transport
- **Maintenance** : En réparation ou entretien
- **Indisponible** : Hors service temporaire

### Maintenance des Véhicules

#### Workflow Post-Mission
1. **Retour de mission** : Le véhicule revient au dépôt
2. **Contrôle maintenance** : Inspection et diagnostic
3. **Vérification administrative** : Contrôle des documents
4. **Validation** : Remise en service

#### Suivi des Interventions
- Historique complet des maintenances
- Planification des entretiens préventifs
- Gestion des coûts de réparation
- Alertes de maintenance préventive

### Documents Véhicules
- **Carte grise** : Document d'immatriculation
- **Assurance** : Police d'assurance en cours
- **Contrôle technique** : Certificat de conformité
- **Permis chauffeur** : Autorisation de conduite

---

## 👨‍💼 Module Chauffeurs

### Gestion des Chauffeurs

#### Ajouter un Chauffeur
1. Accédez à **Chauffeurs** > **Liste**
2. Cliquez sur **+ Nouveau chauffeur**
3. Complétez le formulaire en 4 étapes :

##### Étape 1 : Informations Personnelles
- Nom, prénom, date de naissance
- Adresse complète
- Téléphone et email

##### Étape 2 : Permis et Qualifications
- Numéro de permis
- Types de permis (B, C, CE, etc.)
- Date d'expiration
- Formations spécialisées

##### Étape 3 : Documents
- Upload des documents obligatoires
- Certification des formations
- Visite médicale

##### Étape 4 : Photo et Signature
- Photo d'identité
- Signature numérisée

### Statuts des Chauffeurs
- **Actif** : Disponible pour les missions
- **En mission** : Actuellement en transport
- **Indisponible** : Arrêt maladie, congés
- **Suspendu** : Suspension temporaire

### Planning et Missions
- Attribution automatique des véhicules
- Planification des missions
- Suivi en temps réel
- Historique des trajets

---

## 📦 Module Missions

### Créer une Mission
1. Accédez à **Missions** > **Nouvelle mission**
2. Remplissez les informations :
   - **Transport** : Type, site de départ/arrivée
   - **Ressources** : Véhicule et chauffeur
   - **Planning** : Dates et heures
   - **Chargement** : Volume, poids, observations

### Statuts des Missions
- **En attente** : Mission planifiée
- **En cours** : Transport en cours
- **Terminée** : Mission achevée
- **Annulée** : Mission annulée

### Suivi en Temps Réel
- Position des véhicules
- Statut d'avancement
- Alertes de retard
- Communication avec les chauffeurs

---

## 📦 Module Chargements

### Gestion des Chargements
- **Créer un chargement** : Associé à une mission
- **Types** : Matériaux, marchandises, déchets
- **Unités de mesure** : Tonnes, m³, palettes
- **Traçabilité** : Lieu de chargement/déchargement

### Workflow Chargement
1. **Planification** : Définition du chargement
2. **Chargement** : Prise en charge de la marchandise
3. **Transport** : Acheminement vers la destination
4. **Livraison** : Déchargement et signature client

---

## 💰 Module Facturation

### Créer une Facture
1. Accédez à **Facturation** > **Nouvelle facture**
2. Sélectionnez le client
3. Ajoutez les lignes de facturation
4. Validez et envoyez

### Gestion des Devis
- **Création** : Estimation des coûts
- **Validation client** : Approbation
- **Conversion** : Transformation en facture

### Suivi des Paiements
- **Factures émises** : En attente de paiement
- **Factures payées** : Paiements reçus
- **Factures en retard** : Relances automatiques

### Statistiques Financières
- Chiffre d'affaires mensuel/annuel
- Analyse par client
- Rentabilité par mission

---

## 👥 Module RH (Ressources Humaines)

### Gestion des Employés
- **Dossier personnel** : Informations complètes
- **Contrats** : CDI, CDD, intérim
- **Formations** : Obligatoires et complémentaires

### Suivi des Absences
- **Congés payés** : Planification et validation
- **Arrêts maladie** : Suivi médical
- **Formations** : Temps de formation

### Alertes RH
- **Documents expirés** : Carte d'identité, permis
- **Formations obligatoires** : Recyclage, habilitations
- **Visites médicales** : Suivi médical du travail

---

## ⚙️ Module Administration

### Gestion des Utilisateurs
*(Réservé aux administrateurs)*

#### Créer un Utilisateur
1. Accédez à **Administration** > **Utilisateurs**
2. Cliquez sur **+ Nouvel utilisateur**
3. Définissez :
   - Email et mot de passe temporaire
   - Rôle et permissions
   - Statut (actif/inactif)

### Audit et Traçabilité
- **Logs de connexion** : Suivi des accès
- **Actions utilisateurs** : Historique des modifications
- **Tentatives d'intrusion** : Alertes de sécurité

### Gestion des Rôles et Permissions
- **Définition des rôles** : Création de profils
- **Attribution des permissions** : Accès par module
- **Validation des actions** : Workflow d'approbation

---

## 🗂️ Module Stock Documentaire

### Organisation des Documents
- **Classement par véhicule** : Documents techniques
- **Classement par chauffeur** : Documents personnels
- **Documents entreprise** : Certifications, assurances

### Types de Documents
- **Administratifs** : Cartes grises, assurances
- **Techniques** : Contrôles, maintenances
- **RH** : Contrats, formations
- **Qualité** : Certifications, audits

### Alertes Documentaires
- **Expiration proche** : 30 jours avant échéance
- **Documents manquants** : Obligatoires non fournis
- **Non-conformités** : Documents invalides

---

## ✅ Module Validations

### Workflow de Validation
Système de validation multi-étapes pour les véhicules :

1. **Maintenance** : Validation technique
2. **Administratif** : Contrôle documentaire
3. **HSECQ** : Conformité sécurité
4. **OBC** : Validation opérationnelle

### Statuts de Validation
- **En validation** : Processus en cours
- **Validé** : Toutes étapes approuvées
- **Rejeté** : Non-conformité détectée

---

## 📊 Rapports et Statistiques

### Tableaux de Bord
- **Vue d'ensemble** : Indicateurs clés
- **Analyse financière** : Rentabilité
- **Performance opérationnelle** : Efficacité

### Export de Données
- **Format PDF** : Rapports imprimables
- **Format Excel** : Données analysables
- **Format CSV** : Import dans d'autres systèmes

---

## 🔍 Fonctionnalités Transversales

### Recherche et Filtres
- **Recherche globale** : Dans tous les modules
- **Filtres avancés** : Critères multiples
- **Sauvegarde de filtres** : Recherches fréquentes

### Notifications
- **Alertes temps réel** : Événements urgents
- **Notifications email** : Rappels automatiques
- **Tableau de bord** : Résumé des alertes

### Export et Impression
- **Listes** : Export des données tabulaires
- **Rapports** : Documents formatés
- **Étiquettes** : Codes-barres, QR codes

---

## 🚨 Situations d'Urgence

### Panne de Véhicule
1. **Signalement** : Via l'application mobile
2. **Assistance** : Envoi de dépannage
3. **Remplacement** : Attribution nouveau véhicule
4. **Suivi** : Traçabilité de l'incident

### Accident
1. **Déclaration immédiate** : Formulaire d'urgence
2. **Photos** : Documentation de l'accident
3. **Assurance** : Transmission automatique
4. **Suivi médical** : Si nécessaire

---

## 📱 Application Mobile

### Fonctionnalités Chauffeurs
- **Missions du jour** : Planning personnel
- **Navigation GPS** : Guidage vers destinations
- **Photos** : Documentation des livraisons
- **Signature client** : Preuve de livraison

### Fonctionnalités Gestionnaires
- **Suivi temps réel** : Position des véhicules
- **Validation missions** : Approbation à distance
- **Alertes** : Notifications push

---

## 🛠️ Maintenance et Support

### Auto-Diagnostic
- **État du système** : Vérification automatique
- **Performance** : Monitoring en temps réel
- **Sauvegardes** : Protection des données

### Support Utilisateur
- **Documentation** : Guides intégrés
- **Tutoriels vidéo** : Formations en ligne
- **Assistance technique** : Support dédié

---

## 🔒 Sécurité et Confidentialité

### Protection des Données
- **Chiffrement** : Données sensibles protégées
- **Sauvegardes** : Multiples points de restauration
- **Accès contrôlé** : Authentification forte

### Conformité RGPD
- **Consentements** : Gestion des autorisations
- **Droit à l'oubli** : Suppression des données
- **Traçabilité** : Historique des accès

---

## 💡 Bonnes Pratiques

### Saisie des Données
- **Complétude** : Remplir tous les champs obligatoires
- **Exactitude** : Vérifier les informations
- **Mise à jour** : Maintenir les données à jour

### Workflow Optimal
1. **Planification** : Organiser les missions
2. **Suivi** : Contrôler l'avancement
3. **Validation** : Vérifier la conformité
4. **Archivage** : Conserver l'historique

### Gestion des Alertes
- **Priorisation** : Traiter par ordre d'urgence
- **Délégation** : Assigner aux bonnes personnes
- **Suivi** : Vérifier la résolution

---

## 🆘 FAQ - Foire Aux Questions

### Questions Générales

**Q : Comment réinitialiser mon mot de passe ?**
R : Contactez votre administrateur système ou utilisez la fonction "Mot de passe oublié" sur la page de connexion.

**Q : Puis-je modifier mes informations personnelles ?**
R : Oui, via le menu utilisateur en haut à droite de l'écran.

### Questions Techniques

**Q : Que faire si l'application ne se charge pas ?**
R : Vérifiez votre connexion internet et actualisez la page (F5). Si le problème persiste, contactez le support.

**Q : Comment signaler un bug ?**
R : Utilisez la fonction de signalement intégrée ou contactez directement le support technique.

### Questions Fonctionnelles

**Q : Comment annuler une mission ?**
R : Accédez à la mission, cliquez sur "Actions" puis "Annuler". Justifiez l'annulation dans le commentaire.

**Q : Puis-je modifier une facture après validation ?**
R : Non, les factures validées ne peuvent plus être modifiées. Créez un avoir si nécessaire.

---

## 📞 Contact et Support

### Support Technique
- **Email** : support@transport-system.com
- **Téléphone** : 01 23 45 67 89
- **Horaires** : Lundi à Vendredi, 8h-18h

### Formation
- **Sessions de formation** : Programmées selon besoins
- **Documentation** : Mise à jour régulière
- **Webinaires** : Présentations des nouvelles fonctionnalités

---

*Ce guide est mis à jour régulièrement. Version actuelle : 1.0*
*Date de dernière mise à jour : [Date actuelle]*

---

## 📋 Annexes

### Annexe A : Codes de Statut
### Annexe B : Types de Documents
### Annexe C : Modèles d'Export
### Annexe D : Raccourcis Clavier
### Annexe E : Glossaire des Termes