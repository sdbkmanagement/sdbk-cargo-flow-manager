# Sidebar GMAO améliorée

## Objectif
Rendre la navigation GMAO plus compacte et plus facile à parcourir, tout en retrouvant automatiquement le dernier onglet consulté par chaque utilisateur.

## Modifications prévues
- Regrouper les entrées dans des sections repliables : Vue d’ensemble, Maintenance, Stocks et pilotage, Contrôles.
- Garder automatiquement ouvert le groupe contenant l’onglet actif.
- Ajouter sur ordinateur un bouton permettant de réduire la sidebar en bande d’icônes, puis de la restaurer.
- Afficher une infobulle au survol des icônes lorsque la sidebar est réduite.
- Conserver la présentation adaptée aux petits écrans, sans appliquer le mode compact desktop.
- Mémoriser le dernier onglet GMAO dans le navigateur avec une clé propre à l’identifiant du compte connecté.
- Restaurer cet onglet à l’ouverture du module, avec retour au Tableau de bord si la valeur enregistrée n’est plus valide.

## Détails techniques
- La mémorisation reste locale au navigateur et séparée pour chaque utilisateur ; aucune nouvelle table n’est nécessaire.
- La navigation continuera d’utiliser le contexte GMAO existant afin de ne pas modifier les écrans métier.
- Vérification finale de la compilation TypeScript et du rendu desktop de la sidebar ouverte/réduite.
