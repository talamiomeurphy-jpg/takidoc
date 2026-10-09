-- TakiDoc : table de réception des messages du formulaire Contact
-- À exécuter dans Supabase SQL Editor.
-- La table permet d'enregistrer les messages. Elle n'envoie pas d'e-mail à elle seule.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null check (char_length(trim(email)) between 3 and 254),
  subject text not null check (char_length(trim(subject)) between 1 and 160),
  message text not null check (char_length(trim(message)) between 10 and 5000),
  privacy_consent boolean not null default false check (privacy_consent = true),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Les visiteurs peuvent uniquement ajouter un message.
-- Aucune politique SELECT/UPDATE/DELETE publique n'est créée.
drop policy if exists "Visitors can submit contact messages" on public.contact_messages;
create policy "Visitors can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (
  privacy_consent = true
  and char_length(trim(name)) between 1 and 120
  and char_length(trim(email)) between 3 and 254
  and char_length(trim(subject)) between 1 and 160
  and char_length(trim(message)) between 10 and 5000
);

-- Important :
-- 1. Ne donnez pas SELECT public/anon sur cette table.
-- 2. Les messages doivent être consultés uniquement par un administrateur autorisé.
-- 3. Pour une boîte de réception admin, créez une stratégie SELECT liée à un rôle admin
--    déjà vérifié dans votre schéma. N'inventez pas de colonne role sans vérifier profiles.
-- 4. Ajoutez une protection anti-spam/rate-limit (par ex. CAPTCHA côté serveur/Edge Function)
--    avant d'exposer le formulaire publiquement.
-- 5. Pour envoyer des e-mails de notification, configurez une Edge Function côté serveur
--    et un fournisseur e-mail ; ne placez jamais une clé secrète dans le HTML.
