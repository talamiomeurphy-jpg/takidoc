-- TakiDoc — migration additive pour l'architecture de découverte
-- IMPORTANT : cette migration n'efface aucune table ni aucune ligne.
-- À exécuter d'abord sur une copie/staging et après sauvegarde de Supabase.
-- Vérifier le schéma réel avant production : des tables préexistantes sont conservées.

begin;

-- 1) Catégories normalisées. Les anciennes colonnes sont conservées.
create table if not exists public.template_categories (
  id text primary key,
  name text not null,
  slug text unique,
  description text,
  icon text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ajouter une clé de catégorie sans supprimer la colonne templates.category existante.
alter table public.templates add column if not exists category_id text;
alter table public.templates add column if not exists short_description text;
alter table public.templates add column if not exists preview_image_url text;
alter table public.templates add column if not exists search_keywords text[] not null default '{}';
alter table public.templates add column if not exists display_order integer not null default 0;
alter table public.templates add column if not exists is_featured boolean not null default false;
alter table public.templates add column if not exists updated_at timestamptz not null default now();

-- Importer les catégories existantes depuis templates.category sans écraser les catégories déjà configurées.
insert into public.template_categories (id, name, slug, display_order)
select distinct
  lower(trim(t.category)),
  initcap(replace(trim(t.category), '_', ' ')),
  lower(regexp_replace(trim(t.category), '[^a-zA-Z0-9]+', '-', 'g')),
  100
from public.templates t
where t.category is not null and trim(t.category) <> ''
on conflict (id) do nothing;

update public.templates t
set category_id = lower(trim(t.category))
where (t.category_id is null or t.category_id = '')
  and t.category is not null
  and exists (
    select 1 from public.template_categories c
    where c.id = lower(trim(t.category))
  );

create index if not exists idx_templates_category_id on public.templates(category_id);
create index if not exists idx_templates_discovery on public.templates(is_active, is_featured, display_order);
create index if not exists idx_templates_search_keywords on public.templates using gin(search_keywords);

-- Ajouter la FK seulement si elle n'existe pas déjà.
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'templates_category_id_fkey'
      and conrelid = 'public.templates'::regclass
  ) then
    alter table public.templates
      add constraint templates_category_id_fkey
      foreign key (category_id) references public.template_categories(id)
      on update cascade on delete set null;
  end if;
end $$;

-- 2) Champs des modèles. Si la table existe déjà, on ne la remplace pas.
create table if not exists public.template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  placeholder text,
  help_text text,
  is_required boolean not null default false,
  display_order integer not null default 0,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (template_id, field_key)
);
create index if not exists idx_template_fields_template_order on public.template_fields(template_id, display_order);

-- 3) Aperçus multiples et mots-clés du catalogue.
create table if not exists public.template_previews (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.templates(id) on delete cascade,
  image_url text not null,
  alt_text text,
  preview_type text not null default 'thumbnail',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_template_previews_template_order on public.template_previews(template_id, display_order);

create table if not exists public.template_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  normalized_name text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.template_tag_links (
  template_id text not null references public.templates(id) on delete cascade,
  tag_id uuid not null references public.template_tags(id) on delete cascade,
  primary key (template_id, tag_id)
);
create index if not exists idx_template_tag_links_tag on public.template_tag_links(tag_id);

-- 4) Favoris persistants. L'utilisateur peut explorer sans compte; la synchronisation exige un compte.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null references public.templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, template_id)
);
create index if not exists idx_favorites_template on public.favorites(template_id);

-- 5) Documents générés/achetés. Les données de création restent sous le contrôle du moteur existant.
-- Cette table est créée seulement si elle n'existe pas déjà; aucune table existante n'est écrasée.
create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  purchase_id uuid unique references public.purchases(id) on delete set null,
  template_id text not null references public.templates(id) on delete restrict,
  document_data jsonb not null default '{}'::jsonb,
  storage_path text,
  generated_pdf_url text,
  status text not null default 'pending' check (status in ('pending','ready','failed','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_documents_user_created on public.user_documents(user_id, created_at desc);
create index if not exists idx_user_documents_template on public.user_documents(template_id);

-- 6) Achats en attente. Si une table homonyme existe, elle reste intacte.
create table if not exists public.pending_purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_token text not null unique,
  template_id text not null references public.templates(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  guest_email text,
  guest_phone text,
  amount integer not null check (amount >= 0),
  currency text not null default 'XAF',
  payment_method text not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','expired','cancelled')),
  provider_reference text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or guest_email is not null or guest_phone is not null)
);
create index if not exists idx_pending_purchases_status_expiry on public.pending_purchases(status, expires_at);
create index if not exists idx_pending_purchases_user on public.pending_purchases(user_id, created_at desc);

-- 7) Événements de recherche minimisés pour améliorer les résultats sans stocker de données sensibles.
create table if not exists public.search_events (
  id bigint generated by default as identity primary key,
  query_text text not null,
  result_count integer not null default 0 check (result_count >= 0),
  category_id text references public.template_categories(id) on delete set null,
  session_hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_search_events_created on public.search_events(created_at desc);
create index if not exists idx_search_events_zero_results on public.search_events(result_count, created_at desc);

-- 8) RLS: activer la sécurité et installer des politiques limitées aux nouvelles tables.
alter table public.template_categories enable row level security;
alter table public.template_fields enable row level security;
alter table public.template_previews enable row level security;
alter table public.template_tags enable row level security;
alter table public.template_tag_links enable row level security;
alter table public.favorites enable row level security;
alter table public.user_documents enable row level security;
alter table public.pending_purchases enable row level security;
alter table public.search_events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='template_categories' and policyname='Public can read active categories') then
    create policy "Public can read active categories" on public.template_categories for select using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='template_fields' and policyname='Public can read fields for active templates') then
    create policy "Public can read fields for active templates" on public.template_fields for select using (exists (select 1 from public.templates t where t.id = template_fields.template_id and t.is_active = true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='template_previews' and policyname='Public can read previews for active templates') then
    create policy "Public can read previews for active templates" on public.template_previews for select using (exists (select 1 from public.templates t where t.id = template_previews.template_id and t.is_active = true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='template_tags' and policyname='Public can read tags') then
    create policy "Public can read tags" on public.template_tags for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='template_tag_links' and policyname='Public can read template tag links') then
    create policy "Public can read template tag links" on public.template_tag_links for select using (exists (select 1 from public.templates t where t.id = template_tag_links.template_id and t.is_active = true));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='favorites' and policyname='Users manage own favorites') then
    create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_documents' and policyname='Users read own documents') then
    create policy "Users read own documents" on public.user_documents for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pending_purchases' and policyname='Users read own pending purchases') then
    create policy "Users read own pending purchases" on public.pending_purchases for select using (auth.uid() = user_id);
  end if;
end $$;

-- NOTE: search_events n'a volontairement aucune politique d'écriture publique.
-- L'écriture devra passer par une fonction serveur contrôlée si cette mesure est activée.
-- NOTE: aucune politique INSERT/UPDATE publique n'est ajoutée aux paiements/documents.
-- Les opérations sensibles doivent être confirmées côté serveur / prestataire de paiement.

commit;

-- Après exécution, vérifier les tables et les politiques dans Supabase.
-- Ne supprimez pas les anciennes tables tant que l'application n'a pas été migrée et testée.
