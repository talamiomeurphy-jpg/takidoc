-- ============================================================
-- TAKIDOC — CORRECTIFS DE SÉCURITÉ (à exécuter dans Supabase > SQL Editor)
--
-- Failles détectées dans tes politiques RLS actuelles :
--   1. profiles_update_own   -> un utilisateur peut se passer lui-même en 'admin'
--   2. purchases_insert_own  -> un utilisateur peut s'insérer un achat déjà « paid »
--   3. pending_purchases_update_own_or_admin -> il peut passer son achat en « paid »
--   4. pending_purchases_insert_own -> il peut fixer lui-même le montant
--   5. profiles_select_public -> e-mails et téléphones de tous lisibles par tout le monde
--
-- ⚠️ Exécute BLOC PAR BLOC, puis teste ton site (achat, profil, admin).
-- Si une de tes pages écrit directement dans ces tables depuis le navigateur,
-- il faudra déplacer cette écriture dans une Edge Function (service_role).
-- ============================================================


-- ------------------------------------------------------------
-- 1. Interdire à un utilisateur de modifier son propre rôle
--    (la policy « profiles_update_own » ne vérifie pas la colonne role)
--    Les admins, le SQL Editor et les Edge Functions (service_role)
--    restent autorisés à changer les rôles.
-- ------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Modification du rôle interdite';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();


-- ------------------------------------------------------------
-- 2. Achats : le navigateur ne peut créer qu'un achat « pending ».
--    Le passage à « paid » ne doit venir que du webhook OpenPay
--    (Edge Function handle-openpay-webhook, service_role).
--    Il n'existe déjà aucune policy UPDATE utilisateur sur purchases : parfait.
-- ------------------------------------------------------------
drop policy if exists purchases_insert_own on public.purchases;

create policy purchases_insert_own_pending on public.purchases
  for insert to authenticated
  with check (auth.uid() = user_id and payment_status = 'pending');


-- ------------------------------------------------------------
-- 3 et 4. Achats en attente : plus de modification côté navigateur,
--         création limitée à un état « pending » sans référence de paiement.
--         (l'admin garde tous les droits via pending_purchases_admin_all)
-- ------------------------------------------------------------
drop policy if exists pending_purchases_update_own_or_admin on public.pending_purchases;
drop policy if exists pending_purchases_insert_own on public.pending_purchases;

create policy pending_purchases_insert_own_pending on public.pending_purchases
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and openpay_reference is null
  );


-- ------------------------------------------------------------
-- 5. Profils : chacun ne lit que son propre profil (l'admin lit tout).
--    ⚠️ Si une page affiche le nom/avatar d'AUTRES utilisateurs,
--    crée une vue publique limitée à full_name et avatar_url.
-- ------------------------------------------------------------
drop policy if exists profiles_select_public on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);


-- ------------------------------------------------------------
-- Vérification : liste des policies après correction
-- ------------------------------------------------------------
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'purchases', 'pending_purchases')
order by tablename, policyname;
