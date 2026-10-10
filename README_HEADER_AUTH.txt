TAKIDOC — Harmonisation du header et des accès au compte
=======================================================

Modifications réalisées
- Navigation commune injectée par js/header.js sur l'accueil, le catalogue, les pages informatives et les pages légales.
- Nouvelle présentation responsive : logo TakiDoc, navigation, recherche sur l'accueil, accès au compte et menu mobile.
- Les liens connexion/inscription pointent vers auth.html?action=login ou auth.html?action=signup.
- Le header lit la session Supabase via supabase-js ; le menu utilisateur et la déconnexion s'adaptent à l'état de session.
- auth.html conserve son interface dédiée. Après connexion/inscription, la redirection utilise une destination locale autorisée et revient par défaut vers profile.html.
- editor.html et profile.html conservent leurs en-têtes propres à l'espace de travail / espace personnel pour éviter de casser leurs interfaces fonctionnelles.

À vérifier après déploiement
1. Tester le menu sur ordinateur et mobile.
2. Tester connexion, inscription et déconnexion avec un compte de test.
3. Confirmer que la table profiles est créée à l'inscription (les règles RLS doivent autoriser l'utilisateur à créer/modifier uniquement son propre profil).
4. La navigation « Mon espace personnel » ouvre profile.html. Cela ne signifie pas que la récupération des PDF est déjà implémentée : il faut encore relier les documents sauvegardés dans user_documents à l'interface du profil.
5. Le header ne remplace pas les contrôles de sécurité. Les pages privées doivent vérifier la session et les policies RLS doivent protéger les données.
6. Garder une copie de l'archive actuelle avant de déployer.

Clé Supabase
- Le script utilise uniquement la clé publique anon du projet déjà présente dans le site.
- Ne jamais placer une clé service_role dans le navigateur.
