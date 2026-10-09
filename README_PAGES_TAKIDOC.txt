MISE À JOUR DES PAGES TakiDoc

Cette archive conserve les fichiers existants du site et remplace uniquement les pages informatives/légales, ajoute pages-takidoc.css et conditions.html.

Pages harmonisées : a-propos.html, contact.html, comment-ca-marche.html, conditions.html, mentions-legales.html, cgu.html, cgv.html, confidentialite.html, cookies.html, licence.html, reclamations-remboursements.html.

Le formulaire Contact est câblé pour insérer dans public.contact_messages via l’URL et la clé anon déjà présentes dans index.html. Exécuter contact_messages.sql dans Supabase si ce n’est pas déjà fait. Si l’insertion échoue, vérifier la table, la politique RLS et les logs navigateur. La clé anon est destinée au navigateur; ne jamais exposer service_role. Cette version n’envoie pas de notification e-mail automatique et ne met pas en place de protection anti-spam serveur.

La page conditions.html est une page d’orientation et un résumé, pas un substitut à la lecture des CGU/CGV. Faire valider les textes légaux par un professionnel compétent en République du Congo.

Le reste du site (index.html, editor.html, auth.html, profile.html, scripts, CSS, schéma SQL) est conservé sans modification.
