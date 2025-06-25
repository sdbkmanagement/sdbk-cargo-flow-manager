
# 👥 TUTORIEL MODULE CHAUFFEURS

## 🎯 Vue d'ensemble
Le module Chauffeurs gère l'ensemble du personnel de conduite : recrutement, formation, documents, planning et alertes.

## 📝 Tests à effectuer

### 1. GESTION DES CHAUFFEURS

#### ✅ Test 1.1 : Création d'un chauffeur
**Objectif :** Ajouter un nouveau chauffeur avec informations complètes

**Étapes :**
1. Naviguer vers **Chauffeurs** → **Nouveau**
2. **Étape 1 - Informations personnelles :**
   - **Nom :** DIALLO
   - **Prénom :** Mamadou
   - **Date de naissance :** 15/05/1985
   - **Téléphone :** +224 628 45 67 89
   - **Email :** m.diallo@sdbk.com
   - **Adresse :** Quartier Almamya, Conakry
   - **Code postal :** 001
   - **Ville :** Conakry

3. **Étape 2 - Permis de conduire :**
   - **Numéro de permis :** GN123456789
   - **Types de permis :** C, E (poids lourds)
   - **Date d'expiration :** 30/12/2025

4. **Étape 3 - Documents :**
   - Télécharger **photo d'identité**
   - Télécharger **copie permis**
   - Télécharger **signature numérisée**

5. **Étape 4 - Photo et signature :**
   - Prendre ou télécharger **photo de profil**
   - Capturer **signature électronique**

6. Cliquer sur **"Créer le chauffeur"**

**Résultat attendu :**
- ✅ Message "Chauffeur créé avec succès"
- ✅ Chauffeur dans la liste avec statut "Actif"
- ✅ Tous les documents attachés visibles

#### ✅ Test 1.2 : Modification d'un chauffeur
**Objectif :** Mettre à jour les informations

**Étapes :**
1. Dans la liste, sélectionner un chauffeur
2. Aller dans l'onglet **"Modifier"**
3. Changer le **statut** vers "En formation"
4. Modifier le **téléphone**
5. Sauvegarder

**Résultat attendu :**
- ✅ Modifications enregistrées
- ✅ Historique des changements mis à jour

### 2. GESTION DES DOCUMENTS

#### ✅ Test 2.1 : Upload de documents
**Objectif :** Vérifier le système de gestion documentaire

**Étapes :**
1. Sélectionner un chauffeur
2. Section **"Documents"**
3. Ajouter les documents suivants :
   - **Permis de conduire** (PDF)
   - **Certificat médical** (PDF)
   - **Formation transport dangereux** (PDF)
   - **Assurance personnelle** (PDF)
4. Pour chaque document, définir la **date d'expiration**

**Résultat attendu :**
- ✅ Documents téléchargés avec succès
- ✅ Prévisualisation possible
- ✅ Dates d'expiration enregistrées
- ✅ Calcul automatique des alertes

#### ✅ Test 2.2 : Alertes documents
**Objectif :** Système d'alerte pour documents expirés

**Étapes :**
1. Aller dans l'onglet **"Alertes documents"**
2. Vérifier les **documents expirant dans 30 jours**
3. Vérifier les **documents déjà expirés**

**Résultat attendu :**
- ✅ Liste des alertes par priorité
- ✅ Codes couleur appropriés (rouge/orange/jaune)
- ✅ Actions correctives proposées

### 3. PLANNING DES CHAUFFEURS

#### ✅ Test 3.1 : Affectation de mission
**Objectif :** Assigner un chauffeur à une mission

**Étapes :**
1. Onglet **"Planning"**
2. Vue **calendrier mensuel**
3. Glisser-déposer une mission sur un chauffeur
4. Vérifier la **disponibilité automatique**
5. Confirmer l'affectation

**Résultat attendu :**
- ✅ Mission affectée avec succès
- ✅ Conflit horaire détecté si applicable
- ✅ Statut chauffeur mis à jour
- ✅ Calendrier actualisé

#### ✅ Test 3.2 : Consultation planning
**Objectif :** Vues multiples du planning

**Étapes :**
1. Tester la vue **journalière**
2. Tester la vue **hebdomadaire**
3. Tester la vue **mensuelle**
4. Utiliser les **filtres par chauffeur**

**Résultat attendu :**
- ✅ Toutes les vues fonctionnelles
- ✅ Navigation fluide entre périodes
- ✅ Filtres opérationnels
- ✅ Informations complètes affichées

### 4. STATISTIQUES CHAUFFEURS

#### ✅ Test 4.1 : Tableau de bord
**Objectif :** Indicateurs de performance

**Étapes :**
1. Consulter les **statistiques générales**
2. Vérifier les **indicateurs de disponibilité**
3. Analyser les **statistiques de performance**

**Résultat attendu :**
- ✅ Nombre total de chauffeurs
- ✅ Répartition par statut
- ✅ Taux de disponibilité
- ✅ Alertes documents actives

## 🔍 Tests d'intégration

### Integration avec Missions
#### ✅ Test 5.1 : Affectation automatique
**Étapes :**
1. Créer une mission
2. Vérifier la **liste des chauffeurs disponibles**
3. Assigner un chauffeur
4. Vérifier la **mise à jour du statut**

### Integration avec Flotte
#### ✅ Test 5.2 : Assignation véhicule
**Étapes :**
1. Assigner un véhicule à un chauffeur
2. Vérifier la **compatibilité permis/véhicule**
3. Contrôler l'**exclusivité d'usage**

## 📊 Données de test recommandées

### Profil Chauffeur 1 - Senior
- **Nom :** CAMARA, Alpha
- **Expérience :** 15 ans
- **Permis :** C, CE, transport matières dangereuses
- **Statut :** Actif
- **Spécialité :** Hydrocarbures

### Profil Chauffeur 2 - Junior
- **Nom :** BARRY, Fatoumata
- **Expérience :** 2 ans
- **Permis :** C
- **Statut :** En formation
- **Spécialité :** Bauxite

### Profil Chauffeur 3 - Inactif
- **Nom :** SOW, Ibrahima
- **Statut :** Suspendu
- **Motif :** Formation sécurité obligatoire

## 🔍 Points de contrôle critiques

### Sécurité documents
- [ ] Documents sensibles sécurisés
- [ ] Accès contrôlé par rôle
- [ ] Traçabilité des modifications

### Gestion des alertes
- [ ] Calculs automatiques corrects
- [ ] Notifications en temps réel
- [ ] Escalade appropriée

### Planning
- [ ] Gestion des conflits horaires
- [ ] Respect des temps de repos
- [ ] Optimisation des affectations

## 📊 Critères de succès
- ✅ **Création/modification** sans erreur
- ✅ **Gestion documentaire** complète
- ✅ **Système d'alertes** fonctionnel
- ✅ **Planning** intégré et optimisé
- ✅ **Statistiques** précises et utiles

---
**Module Chauffeurs - Version de test 1.0**
