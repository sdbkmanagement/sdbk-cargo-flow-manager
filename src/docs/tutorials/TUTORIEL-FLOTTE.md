
# 📋 TUTORIEL MODULE FLOTTE (VÉHICULES)

## 🎯 Vue d'ensemble
Le module Flotte permet de gérer l'ensemble du parc de véhicules : ajout, modification, suivi de maintenance et validation.

## 📝 Tests à effectuer

### 1. GESTION DES VÉHICULES

#### ✅ Test 1.1 : Création d'un nouveau véhicule
**Objectif :** Vérifier que l'ajout d'un véhicule fonctionne correctement

**Étapes :**
1. Naviguer vers **Flotte** dans le menu
2. Cliquer sur **"Nouveau véhicule"**
3. Remplir le formulaire avec ces données de test :
   - **Numéro :** V001
   - **Immatriculation :** AB-123-CD
   - **Marque :** Mercedes
   - **Modèle :** Actros
   - **Type de transport :** Hydrocarbures
   - **Capacité maximale :** 25000
   - **Unité :** Litres
   - **Année de fabrication :** 2020
   - **Numéro de châssis :** WDB9634123L123456
4. Cliquer sur **"Créer le véhicule"**

**Résultat attendu :**
- ✅ Message de succès "Véhicule créé avec succès"
- ✅ Véhicule apparaît dans la liste
- ✅ Statut initial : "Disponible"

#### ✅ Test 1.2 : Modification d'un véhicule
**Objectif :** Vérifier la modification des informations véhicule

**Étapes :**
1. Dans la liste des véhicules, cliquer sur l'icône **"Modifier"** (crayon)
2. Modifier la capacité : **30000 Litres**
3. Changer le statut vers **"Maintenance"**
4. Cliquer sur **"Sauvegarder"**

**Résultat attendu :**
- ✅ Message "Véhicule modifié avec succès"
- ✅ Nouvelles informations affichées dans la liste

#### ✅ Test 1.3 : Suppression d'un véhicule
**Objectif :** Vérifier la suppression sécurisée

**Étapes :**
1. Cliquer sur l'icône **"Supprimer"** (poubelle rouge)
2. Confirmer la suppression dans la boîte de dialogue

**Résultat attendu :**
- ✅ Boîte de confirmation affichée
- ✅ Véhicule supprimé de la liste après confirmation

### 2. GESTION DE LA MAINTENANCE

#### ✅ Test 2.1 : Ajout d'une maintenance
**Objectif :** Enregistrer une intervention de maintenance

**Étapes :**
1. Sélectionner un véhicule
2. Aller dans l'onglet **"Maintenance"**
3. Cliquer sur **"Ajouter une maintenance"**
4. Remplir :
   - **Type :** Révision générale
   - **Date :** Aujourd'hui
   - **Kilométrage :** 45000
   - **Coût :** 850.00
   - **Garage :** Garage Central SDBK
   - **Description :** Changement huile moteur, filtres
   - **Pièces changées :** Filtre à huile, Filtre à air
5. Sauvegarder

**Résultat attendu :**
- ✅ Maintenance enregistrée
- ✅ Historique de maintenance mis à jour
- ✅ Prochaine maintenance calculée automatiquement

#### ✅ Test 2.2 : Consultation de l'historique
**Objectif :** Vérifier l'affichage de l'historique complet

**Étapes :**
1. Consulter l'onglet **"Maintenance"**
2. Vérifier l'affichage de toutes les maintenances

**Résultat attendu :**
- ✅ Liste chronologique des maintenances
- ✅ Détails complets pour chaque intervention
- ✅ Coûts totaux calculés

### 3. WORKFLOW DE VALIDATION

#### ✅ Test 3.1 : Processus de validation
**Objectif :** Tester le workflow de validation multi-étapes

**Étapes :**
1. Aller dans l'onglet **"Validation"**
2. Sélectionner un véhicule nécessitant validation
3. **Étape Maintenance :** Valider avec commentaire "Maintenance à jour"
4. **Étape Administrative :** Valider avec commentaire "Documents conformes"
5. **Étape HSECQ :** Valider avec commentaire "Normes respectées"
6. **Étape OBC :** Valider avec commentaire "Contrôle final OK"

**Résultat attendu :**
- ✅ Chaque étape se valide successivement
- ✅ Statut global passe à "Validé"
- ✅ Historique des validations enregistré
- ✅ Véhicule devient "Disponible"

#### ✅ Test 3.2 : Rejet d'une validation
**Objectif :** Tester le processus de rejet

**Étapes :**
1. Créer un nouveau véhicule
2. Dans le workflow, rejeter à l'étape **"HSECQ"**
3. Commentaire : "Équipement de sécurité manquant"

**Résultat attendu :**
- ✅ Statut global : "Rejeté"
- ✅ Véhicule en statut "Validation requise"
- ✅ Commentaire de rejet enregistré

### 4. STATISTIQUES ET INDICATEURS

#### ✅ Test 4.1 : Tableaux de bord
**Objectif :** Vérifier l'affichage des statistiques

**Étapes :**
1. Consulter les **statistiques de flotte**
2. Vérifier les **indicateurs de maintenance**
3. Contrôler les **alertes véhicules**

**Résultat attendu :**
- ✅ Nombre total de véhicules correct
- ✅ Répartition par statut précise
- ✅ Alertes maintenance affichées
- ✅ Graphiques à jour

## 🔍 Points de contrôle critiques

### Sécurité
- [ ] Seuls les utilisateurs autorisés accèdent au module
- [ ] Modification/suppression sécurisées
- [ ] Workflow de validation respecté

### Performance
- [ ] Chargement rapide de la liste véhicules
- [ ] Recherche et filtres fonctionnels
- [ ] Export de données possible

### Intégration
- [ ] Lien avec module Chauffeurs (assignation)
- [ ] Lien avec module Missions (disponibilité)
- [ ] Synchronisation avec autres modules

## 📊 Critères de succès
- ✅ **100% des opérations CRUD** fonctionnent
- ✅ **Workflow de validation** complet opérationnel
- ✅ **Calculs automatiques** corrects (maintenance, statistiques)
- ✅ **Sécurité et permissions** respectées
- ✅ **Interface utilisateur** intuitive et responsive

## 🚨 En cas de problème
1. Vérifier les **permissions utilisateur**
2. Contrôler les **données obligatoires**
3. Vérifier la **connectivité base de données**
4. Consulter les **logs d'erreur** en mode développeur

---
**Module Flotte - Version de test 1.0**
