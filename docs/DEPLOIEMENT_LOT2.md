# TakiDoc — Lot 2 : déploiement et tests

Dans ton projet, les fichiers vont ici :

```
TakiDoc-Project/
├─ generator/                       ← remplace server.js, package.json ; ajoute lib/
│   ├─ server.js
│   ├─ package.json
│   └─ lib/ (scope-css.js, snapshot.js)
└─ supabase/functions/
    ├─ _shared/                     ← NOUVEAU (6 fichiers)
    ├─ create-purchase-intent/      ← remplace index.ts
    ├─ authorize-download/          ← remplace index.ts
    ├─ purchase-status/             ← NOUVEAU
    └─ handle-notchpay-webhook/     ← NOUVEAU
```

---

## 1. Générateur (en local)

```powershell
cd TakiDoc-Project\generator
npm install
npm start
```

Le `.env` du générateur ne change pas (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`).

### Test sans paiement (mode instantané)

1. Dans Supabase (SQL Editor), crée un nonce de test :

```sql
insert into public.generation_nonces (template_id, format, expires_at)
values ('cv_executif_moderne', 'pdf', now() + interval '10 minutes')
returning nonce;
```

2. Envoie un petit document « édité » :

```powershell
$jsonBody = @"
{
  "nonce": "COLLE-LE-NONCE-ICI",
  "template_id": "cv_executif_moderne",
  "format": "pdf",
  "data": {
    "snapshot": {
      "html": "<div><h1>Test instantané</h1><p>Texte modifié par l'utilisateur, avec des accents : é à ç.</p></div>",
      "primary_color": "#FF6B35",
      "color_active": true,
      "font_custom": false
    }
  }
}
"@
$bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
Invoke-RestMethod -Uri "http://localhost:3001/api/generate" -Method Post `
  -ContentType "application/json; charset=utf-8" -Body $bytes `
  -OutFile "$env:USERPROFILE\Desktop\test-snapshot.pdf"
```

(Ce test valide le serveur ; le vrai instantané, complet, sera envoyé par l'éditeur au lot 3.)

---

## 2. Secrets Supabase

Déjà présents : `NOTCHPAY_PUBLIC_KEY`, `NOTCHPAY_PRIVATE_KEY`, `NOTCHPAY_HASH_KEY`.

À ajouter :

```powershell
supabase secrets set ALLOWED_ORIGINS="https://takidoc.onrender.com,http://localhost:5500,http://127.0.0.1:5500"
supabase secrets set SITE_URL="https://takidoc.onrender.com"
supabase secrets set GENERATOR_URL="http://localhost:3001"
supabase secrets set NOTCHPAY_DEBUG="true"
```

- `GENERATOR_URL` : remplace par l'adresse publique du générateur dès qu'il est déployé.
- `NOTCHPAY_DEBUG=true` : journalise le contenu complet des webhooks pendant les tests.
  **À repasser à `false` (ou supprimer) avant la production** : le corps contient des données clients.
- `ENABLE_DOCX` : ne le crée PAS tant que le Word n'est pas réparé (le format Word reste refusé).
- `NOTCHPAY_ENFORCE_SIGNATURE` : ne le crée pas encore (voir étape 5).

---

## 3. Déploiement des fonctions

```powershell
cd TakiDoc-Project
supabase functions deploy create-purchase-intent
supabase functions deploy authorize-download
supabase functions deploy purchase-status
supabase functions deploy handle-notchpay-webhook --no-verify-jwt
```

Supprime l'ancienne fonction qui n'a plus de raison d'être (et qui acceptait n'importe quoi) :

```powershell
supabase functions delete handle-openpay-webhook
```

---

## 4. Enregistrer le webhook dans Notch Pay

Dashboard Notch Pay → Développeur → Webhooks → « Ajouter un premier endpoint » :

```
https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/handle-notchpay-webhook
```

Coche au minimum les événements de paiement (`payment.complete`, `payment.failed`, `payment.canceled`, `payment.expired`).

---

## 5. Premier test de bout en bout (avant l'éditeur)

1. Crée une intention d'achat (invité) :

```powershell
$anon = "TA-CLE-ANON-SUPABASE"   # Supabase > Settings > API > anon public
$body = '{"template_id":"cv_executif_moderne","guest_email":"test@example.com","guest_phone":"06 123 45 67","customer_name":"Test TakiDoc"}'
Invoke-RestMethod -Uri "https://wyfkogowsdbxctbpfuud.supabase.co/functions/v1/create-purchase-intent" `
  -Method Post -ContentType "application/json; charset=utf-8" `
  -Headers @{ Authorization = "Bearer $anon"; apikey = $anon } `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

2. Ouvre l'`authorization_url` renvoyée et paie avec les moyens de test de Notch Pay.
3. Regarde les journaux : Supabase → Edge Functions → `handle-notchpay-webhook` → Logs.
   - Note la valeur de `signature:` (`ok`, `mismatch`, `no_header`…) et les noms d'en-têtes affichés.
   - **Envoie-moi cette ligne** : elle me permet de confirmer le format de signature.
4. Vérifie l'achat :

```sql
select status, provider_reference, failure_reason, purchase_id
  from public.pending_purchases order by created_at desc limit 3;
```

   `status = completed` et `purchase_id` rempli = succès.
5. Quand `signature: ok` est confirmé, active le blocage :

```powershell
supabase secrets set NOTCHPAY_ENFORCE_SIGNATURE="true"
```

---

## 6. Ce qui se passe en cas de problème

| Symptôme | Cause probable | Action |
|---|---|---|
| `payment_provider_error` à la création | clé publique erronée ou montant refusé | journaux de `create-purchase-intent` |
| Achat reste `pending` après paiement | webhook non reçu | la page de retour rattrape via `purchase-status` |
| Statut `review` | montant ou devise différents de l'attendu | `pending_purchases.failure_reason` |
| `login_required` au téléchargement | achat fait connecté, session perdue | se reconnecter |
| `quota_exceeded` | 5 téléchargements utilisés | normal (réglable dans la migration) |
