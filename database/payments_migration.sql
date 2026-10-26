-- ============================================================
-- TAKIDOC — MIGRATION PAIEMENT NOTCH PAY (Lot 1 / 3)
-- À exécuter dans Supabase > SQL Editor, en UNE seule fois.
--
-- Ce que fait cette migration :
--   1. Active la RLS sur les tables sensibles (sans effet si déjà active)
--   2. Neutralise les anciens achats « simulation » (ils ne donnent plus accès)
--   3. Prépare pending_purchases et purchases pour Notch Pay
--   4. Réécrit les fonctions de nonce (atomiques, liées à l'achat, avec quota)
--   5. Ajoute complete_purchase() : validation de paiement idempotente et atomique
--   6. Réserve toutes ces fonctions au service_role (jamais appelables du navigateur)
--   7. Resserre les policies : plus aucune écriture d'achat depuis le navigateur
--
-- Statuts utilisés (conformes à ton code existant) :
--   purchases.payment_status : pending | completed | failed | refunded | void
--   pending_purchases.status : pending | completed | failed | cancelled | expired
--
-- ⚠️ Les anciennes Edge Functions (create-purchase-intent, authorize-download,
--    handle-openpay-webhook) ne fonctionneront plus après cette migration.
--    Elles sont remplacées au lot 2 ; l'éditeur ne les appelle pas aujourd'hui.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. RLS active sur les tables du paiement
-- ------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.purchases         enable row level security;
alter table public.pending_purchases enable row level security;
alter table public.user_documents    enable row level security;
alter table public.generation_nonces enable row level security;


-- ------------------------------------------------------------
-- 2. Les achats « simulation » ne donnent plus accès à rien
-- ------------------------------------------------------------
update public.purchases
   set payment_status = 'void'
 where payment_method = 'openpay_simulation'
    or payment_reference like 'SIM\_%' escape '\';


-- ------------------------------------------------------------
-- 3a. pending_purchases : colonnes Notch Pay
-- ------------------------------------------------------------
do $$
begin
  if exists (
        select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'pending_purchases'
           and column_name = 'openpay_reference')
     and not exists (
        select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'pending_purchases'
           and column_name = 'provider_reference')
  then
    alter table public.pending_purchases
      rename column openpay_reference to provider_reference;
  end if;
end $$;

alter table public.pending_purchases
  add column if not exists provider_reference text,
  add column if not exists provider           text        not null default 'notchpay',
  add column if not exists authorization_url  text,
  add column if not exists purchase_id        uuid references public.purchases(id),
  add column if not exists document_data      jsonb       not null default '{}'::jsonb,
  add column if not exists failure_reason     text,
  add column if not exists completed_at       timestamptz,
  add column if not exists updated_at         timestamptz not null default now();

update public.pending_purchases
   set provider = 'openpay'
 where payment_method ilike 'openpay%';

alter table public.pending_purchases
  drop constraint if exists pending_purchases_status_check;
alter table public.pending_purchases
  add constraint pending_purchases_status_check
  check (status in ('pending', 'completed', 'failed', 'cancelled', 'expired')) not valid;

create index if not exists pending_purchases_provider_reference_idx
  on public.pending_purchases (provider_reference);
create index if not exists pending_purchases_user_created_idx
  on public.pending_purchases (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_pending_purchases_touch on public.pending_purchases;
create trigger trg_pending_purchases_touch
  before update on public.pending_purchases
  for each row execute function public.touch_updated_at();


-- ------------------------------------------------------------
-- 3b. purchases : quota de téléchargements et durée d'accès
--     Réglages par défaut : 5 téléchargements, 30 jours
--     (modifiables dans complete_purchase ci-dessous)
-- ------------------------------------------------------------
alter table public.purchases
  add column if not exists max_generations    integer not null default 5,
  add column if not exists access_expires_at  timestamptz,
  add column if not exists pending_purchase_id uuid;

-- Un même paiement Notch Pay ne peut créer qu'un seul achat
create unique index if not exists purchases_payment_reference_uidx
  on public.purchases (payment_reference)
  where payment_reference is not null;

alter table public.purchases
  drop constraint if exists purchases_payment_status_check;
alter table public.purchases
  add constraint purchases_payment_status_check
  check (payment_status in ('pending', 'completed', 'failed', 'refunded', 'void')) not valid;


-- ------------------------------------------------------------
-- 3c. generation_nonces : date de consommation + index
-- ------------------------------------------------------------
alter table public.generation_nonces
  add column if not exists consumed_at timestamptz;

create index if not exists generation_nonces_purchase_idx
  on public.generation_nonces (purchase_id, created_at desc);


-- ------------------------------------------------------------
-- 4. Fonctions de nonce — on supprime TOUTES les anciennes versions
-- ------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'create_generation_nonce',
         'validate_and_consume_nonce',
         'release_generation_nonce',
         'generation_quota',
         'complete_purchase',
         'cleanup_payment_data'
       )
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;


-- 4a. Quota restant pour un achat
create or replace function public.generation_quota(p_purchase_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases%rowtype;
  v_used     integer;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id;
  if not found then
    return null;
  end if;

  -- Compte les nonces consommés + ceux encore valides (évite les rafales)
  select count(*) into v_used
    from public.generation_nonces n
   where n.purchase_id = p_purchase_id
     and (n.used = true or n.expires_at > now());

  return jsonb_build_object(
    'max',               v_purchase.max_generations,
    'used',              v_used,
    'remaining',         greatest(v_purchase.max_generations - v_used, 0),
    'access_expires_at', v_purchase.access_expires_at
  );
end;
$$;


-- 4b. Création d'un nonce : uniquement pour un achat payé, dans le quota
create or replace function public.create_generation_nonce(
  p_purchase_id uuid,
  p_format      text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase public.purchases%rowtype;
  v_quota    jsonb;
  v_nonce    uuid;
  v_expires  timestamptz := now() + interval '5 minutes';
begin
  if p_format is null or p_format not in ('pdf', 'docx') then
    return jsonb_build_object('ok', false, 'error', 'invalid_format');
  end if;

  -- Verrou sur l'achat : deux demandes simultanées ne peuvent pas dépasser le quota
  select * into v_purchase
    from public.purchases
   where id = p_purchase_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'purchase_not_found');
  end if;

  if v_purchase.payment_status <> 'completed' then
    return jsonb_build_object('ok', false, 'error', 'not_paid');
  end if;

  if v_purchase.access_expires_at is not null and v_purchase.access_expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'access_expired');
  end if;

  v_quota := public.generation_quota(p_purchase_id);

  if (v_quota->>'remaining')::integer <= 0 then
    return jsonb_build_object('ok', false, 'error', 'quota_exceeded', 'quota', v_quota);
  end if;

  insert into public.generation_nonces
    (template_id, user_id, guest_email, guest_phone, format, purchase_id, expires_at)
  values
    (v_purchase.template_id, v_purchase.user_id, v_purchase.guest_email,
     v_purchase.guest_phone, p_format, v_purchase.id, v_expires)
  returning nonce into v_nonce;

  return jsonb_build_object(
    'ok',         true,
    'nonce',      v_nonce,
    'expires_at', v_expires,
    'expires_in', 300,
    'max',        (v_quota->>'max')::integer,
    'remaining',  (v_quota->>'remaining')::integer - 1
  );
end;
$$;


-- 4c. Validation + consommation atomique (appelée par le générateur)
--     Signature compatible avec le générateur actuel (p_nonce, p_template_id).
create or replace function public.validate_and_consume_nonce(
  p_nonce       text,
  p_template_id text,
  p_format      text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nonce uuid;
  v_count integer;
begin
  begin
    v_nonce := p_nonce::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  update public.generation_nonces g
     set used = true,
         consumed_at = now()
   where g.nonce = v_nonce
     and g.used = false
     and g.expires_at > now()
     and g.template_id = p_template_id
     and (p_format is null or g.format = p_format)
     and (
           g.purchase_id is null      -- nonce créé à la main par un admin (tests)
        or exists (
             select 1 from public.purchases p
              where p.id = g.purchase_id
                and p.payment_status = 'completed'
           )
         );

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;


-- 4d. Restitution d'un nonce si la génération a échoué côté serveur
create or replace function public.release_generation_nonce(p_nonce text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nonce uuid;
  v_count integer;
begin
  begin
    v_nonce := p_nonce::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  update public.generation_nonces
     set used = false,
         consumed_at = null
   where nonce = v_nonce
     and used = true
     and consumed_at > now() - interval '10 minutes';

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;


-- ------------------------------------------------------------
-- 5. Validation d'un paiement : atomique, idempotente, contrôlée
--    Appelée UNIQUEMENT après vérification auprès de Notch Pay.
-- ------------------------------------------------------------
create or replace function public.complete_purchase(
  p_purchase_token     text,
  p_provider_reference text,
  p_amount             integer,
  p_currency           text,
  p_payment_method     text default 'notchpay'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pending     public.pending_purchases%rowtype;
  v_purchase_id uuid;
begin
  -- Verrou : deux webhooks simultanés se mettent en file
  select * into v_pending
    from public.pending_purchases
   where purchase_token = p_purchase_token
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'pending_not_found');
  end if;

  -- Déjà traité : on répond « ok » sans rien recréer
  if v_pending.status = 'completed' and v_pending.purchase_id is not null then
    return jsonb_build_object('ok', true, 'idempotent', true, 'purchase_id', v_pending.purchase_id);
  end if;

  if p_currency is distinct from 'XAF' then
    update public.pending_purchases
       set failure_reason = format('currency_mismatch: reçu %s', coalesce(p_currency, 'null'))
     where id = v_pending.id;
    return jsonb_build_object('ok', false, 'error', 'currency_mismatch');
  end if;

  -- Le montant payé doit être EXACTEMENT celui figé à la création de l'intention
  if p_amount is distinct from v_pending.amount then
    update public.pending_purchases
       set failure_reason = format('amount_mismatch: payé %s, attendu %s', p_amount, v_pending.amount)
     where id = v_pending.id;
    return jsonb_build_object('ok', false, 'error', 'amount_mismatch');
  end if;

  begin
    insert into public.purchases
      (user_id, guest_email, guest_phone, template_id, amount_paid, currency,
       payment_method, payment_reference, payment_status, access_expires_at, pending_purchase_id)
    values
      (v_pending.user_id, v_pending.guest_email, v_pending.guest_phone, v_pending.template_id,
       v_pending.amount, 'XAF', coalesce(p_payment_method, 'notchpay'), p_provider_reference,
       'completed', now() + interval '30 days', v_pending.id)
    returning id into v_purchase_id;
  exception when unique_violation then
    -- Cette référence de paiement existe déjà
    select id into v_purchase_id
      from public.purchases
     where payment_reference = p_provider_reference
       and pending_purchase_id = v_pending.id;

    if v_purchase_id is null then
      return jsonb_build_object('ok', false, 'error', 'reference_already_used');
    end if;
  end;

  update public.pending_purchases
     set status = 'completed',
         provider_reference = p_provider_reference,
         purchase_id = v_purchase_id,
         completed_at = now(),
         failure_reason = null
   where id = v_pending.id;

  insert into public.user_documents (purchase_id, user_id, template_id, document_data)
  values (v_purchase_id, v_pending.user_id, v_pending.template_id,
          coalesce(v_pending.document_data, '{}'::jsonb))
  on conflict (purchase_id) do nothing;

  return jsonb_build_object('ok', true, 'idempotent', false, 'purchase_id', v_purchase_id);
end;
$$;


-- ------------------------------------------------------------
-- 5b. Nettoyage (à planifier, voir plus bas)
-- ------------------------------------------------------------
create or replace function public.cleanup_payment_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expired integer;
  v_nonces  integer;
begin
  -- Intentions jamais payées après 24 h
  update public.pending_purchases
     set status = 'expired'
   where status = 'pending'
     and expires_at < now() - interval '1 day';
  get diagnostics v_expired = row_count;

  -- Nonces inutilisés et expirés (1 jour) ; nonces consommés (90 jours)
  delete from public.generation_nonces
   where (used = false and expires_at < now() - interval '1 day')
      or (used = true  and created_at < now() - interval '90 days');
  get diagnostics v_nonces = row_count;

  return jsonb_build_object('pending_expired', v_expired, 'nonces_deleted', v_nonces);
end;
$$;


-- ------------------------------------------------------------
-- 6. Droits : ces fonctions ne sont appelables QUE par le serveur
--    (sinon n'importe quel visiteur pourrait les appeler via l'API publique)
-- ------------------------------------------------------------
revoke all on function public.generation_quota(uuid)                               from public, anon, authenticated;
revoke all on function public.create_generation_nonce(uuid, text)                  from public, anon, authenticated;
revoke all on function public.validate_and_consume_nonce(text, text, text)         from public, anon, authenticated;
revoke all on function public.release_generation_nonce(text)                       from public, anon, authenticated;
revoke all on function public.complete_purchase(text, text, integer, text, text)   from public, anon, authenticated;
revoke all on function public.cleanup_payment_data()                               from public, anon, authenticated;

grant execute on function public.generation_quota(uuid)                             to service_role;
grant execute on function public.create_generation_nonce(uuid, text)               to service_role;
grant execute on function public.validate_and_consume_nonce(text, text, text)      to service_role;
grant execute on function public.release_generation_nonce(text)                    to service_role;
grant execute on function public.complete_purchase(text, text, integer, text, text) to service_role;
grant execute on function public.cleanup_payment_data()                            to service_role;


-- ------------------------------------------------------------
-- 7. Policies : les achats ne s'écrivent plus depuis le navigateur
--    (tout passe par les Edge Functions, qui utilisent le service_role)
-- ------------------------------------------------------------
drop policy if exists purchases_insert_own                    on public.purchases;
drop policy if exists purchases_insert_own_pending            on public.purchases;
drop policy if exists pending_purchases_insert_own            on public.pending_purchases;
drop policy if exists pending_purchases_insert_own_pending    on public.pending_purchases;
drop policy if exists pending_purchases_update_own_or_admin   on public.pending_purchases;

-- Un document ne peut être rattaché qu'à un achat payé par son propriétaire
drop policy if exists user_documents_insert_own               on public.user_documents;
drop policy if exists user_documents_insert_own_purchase      on public.user_documents;
create policy user_documents_insert_own_purchase on public.user_documents
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
        from public.purchases p
       where p.id = purchase_id
         and p.user_id = auth.uid()
         and p.payment_status = 'completed'
    )
  );

commit;


-- ============================================================
-- VÉRIFICATIONS (exécute-les séparément après la migration)
-- ============================================================

-- A. La RLS doit être active (rowsecurity = true) sur ces 5 tables
-- select relname, relrowsecurity
--   from pg_class
--  where relname in ('profiles','purchases','pending_purchases','user_documents','generation_nonces')
--    and relnamespace = 'public'::regnamespace;

-- B. Aucun de ces droits ne doit être « true » pour anon / authenticated
-- select
--   has_function_privilege('anon',          'public.complete_purchase(text,text,integer,text,text)', 'execute') as anon_complete,
--   has_function_privilege('authenticated', 'public.complete_purchase(text,text,integer,text,text)', 'execute') as auth_complete,
--   has_function_privilege('anon',          'public.create_generation_nonce(uuid,text)',             'execute') as anon_nonce,
--   has_function_privilege('authenticated', 'public.validate_and_consume_nonce(text,text,text)',     'execute') as auth_validate,
--   has_function_privilege('service_role',  'public.complete_purchase(text,text,integer,text,text)', 'execute') as service_ok;

-- C. Nettoyage automatique chaque nuit (si l'extension pg_cron est activée)
-- select cron.schedule('takidoc-cleanup', '15 3 * * *', $$ select public.cleanup_payment_data(); $$);

-- D. Pour tester le générateur à la main, SANS paiement (réservé à toi, dans le SQL Editor) :
-- insert into public.generation_nonces (template_id, format, expires_at)
-- values ('cv_executif_moderne', 'pdf', now() + interval '10 minutes')
-- returning nonce;
