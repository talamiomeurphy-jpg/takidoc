TAKIDOC — REFONTE V1 : ACCUEIL DE DÉCOUVERTE + MIGRATION SQL ADDITIVE

CONTENU
- index.html : accueil recentré sur la découverte, recherche dans l'en-tête commun, catégories horizontales et grille de documents responsive.
- documents.html : redirection de compatibilité vers index.html pour éviter de casser les anciens liens/bookmarks.
- database/refonte_architecture_additive.sql : migration additive pour catégories normalisées, champs, aperçus, tags, favoris, documents et achats en attente.
- L'éditeur editor.html et son moteur JS ne sont pas modifiés.

AVANT DÉPLOIEMENT
1. Sauvegarder Supabase et exécuter le SQL d'abord sur un projet de test.
2. Vérifier les tables existantes et leurs colonnes. Le SQL ne supprime aucune table ni ligne, mais des tables homonymes déjà présentes peuvent avoir un schéma différent et nécessiter une migration manuelle.
3. Ne pas considérer le SQL comme preuve que le paiement ou la récupération de PDF fonctionnent. Les flux de paiement doivent être vérifiés côté serveur.
4. Tester sur téléphone : recherche, catégories, ouverture du modèle, favoris, authentification, éditeur, achat et récupération.
5. Le site n'est pas déployé par cette archive : elle doit être validée puis publiée dans l'environnement d'hébergement.

NOTE PRODUIT
La bibliothèque principale est maintenant sur l'accueil. documents.html est conservée comme redirection de compatibilité, et non comme deuxième catalogue.
