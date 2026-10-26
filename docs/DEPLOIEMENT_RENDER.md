# TakiDoc — Héberger le générateur sur Render

Le générateur ne doit pas tourner sur ton PC : on l'héberge sur Render pour qu'il soit
joignable en permanence. Ton PC ne sert plus qu'aux tests.

## 1. Préparer le dossier `generator/`

Après `install-lot2.ps1`, le dossier doit contenir :
`Dockerfile`, `.dockerignore`, `.puppeteerrc.cjs`, `server.js`, `package.json`, `lib/`.

```powershell
cd generator
npm install          # met à jour package-lock.json (obligatoire : nouvelle dépendance sanitize-html)
```

Vérifie que **`.env` est dans `.gitignore`** (il contient la clé service_role), puis envoie sur GitHub :

```powershell
cd ..
git add generator
git commit -m "Générateur v3 : mode instantané, Docker, Render"
git push
```

## 2. Créer le service sur Render

Render → **New +** → **Web Service** → ton dépôt GitHub.

| Réglage | Valeur |
|---|---|
| Name | `takidoc-generator` |
| Root Directory | `generator` |
| Language / Runtime | **Docker** (Render détecte le Dockerfile) |
| Instance Type | **Free** pour les tests, **Starter** pour la production |
| Health Check Path | `/health` |
| Build Filter (Advanced) | Included Paths : `generator/**` (une modification du site ne relance pas ce build) |

### Variables d'environnement

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://wyfkogowsdbxctbpfuud.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ta clé service_role (Supabase > Settings > API) |
| `ALLOWED_ORIGINS` | `https://takidoc.onrender.com` |

Ne définis pas `PORT` : Render le fournit. Les réglages mémoire
(`MAX_CONCURRENT_RENDERS=1`, `PREWARM_BROWSER=false`, `BROWSER_RECYCLE_AFTER=40`)
sont déjà dans le Dockerfile ; tu peux les modifier ici si besoin.

Le premier déploiement est long (téléchargement de Chromium) : compte plusieurs minutes.

## 3. Vérifier

Ouvre `https://takidoc-generator.onrender.com/health` (adapte le nom). Tu dois voir
`"status": "ok"`. Au premier appel après une période d'inactivité, compte environ une
minute d'attente sur l'offre gratuite.

## 4. Relier Supabase au générateur

```powershell
supabase secrets set GENERATOR_URL="https://takidoc-generator.onrender.com"
```

(L'adresse exacte est affichée en haut de la page du service sur Render.)

## 5. Disponibilité : ce que donne chaque offre

**Offre gratuite**
- Le service s'endort après 15 minutes sans requête, et le réveil prend environ une minute.
- 512 Mo de mémoire et 0,1 CPU : la génération d'un PDF est lente, et une coupure par manque de
  mémoire est possible si plusieurs documents partent en même temps.
- Les 750 heures gratuites du mois sont partagées par tous tes services web gratuits : un seul
  service allumé en permanence les consomme presque entièrement.
- Astuce : un moniteur gratuit (UptimeRobot) qui appelle `/health` toutes les 5 minutes évite
  l'endormissement. Ça marche, mais ça consomme ces 750 heures.
- Le lot 3 ajoutera aussi un « réveil » automatique : l'éditeur appelle `/health` dès que
  l'utilisateur lance un paiement, donc le service est déjà réveillé quand il revient payer.

**Offre Starter (environ 7 $/mois)**
- Le service ne s'endort jamais : c'est la seule option vraiment disponible 24 h/24.
- 0,5 CPU : les PDF sortent bien plus vite.
- Recommandée dès que tu encaisses de vrais paiements.

## 6. En cas de problème

| Symptôme | Cause probable |
|---|---|
| Build qui échoue sur `npm ci` | `package-lock.json` pas à jour : relance `npm install` puis `git push` |
| `Could not find Chrome` dans les journaux | `.puppeteerrc.cjs` absent du dossier (nom sans le point) |
| PDF très lent ou service qui redémarre | mémoire insuffisante : passe en Starter |
| `Origine non autorisée` / erreur CORS | `ALLOWED_ORIGINS` ne contient pas l'adresse exacte du site |
| `Erreur de validation du nonce` | clé `SUPABASE_SERVICE_ROLE_KEY` manquante ou erronée |
