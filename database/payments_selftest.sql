-- ============================================================
-- TAKIDOC — AUTO-TEST DE LA MIGRATION PAIEMENT
-- À exécuter APRÈS payments_migration.sql, dans le SQL Editor.
--
-- Ce script simule un achat complet, puis s'ANNULE TOUT SEUL :
-- aucune donnée de test n'est conservée dans ta base.
--
-- Résultat attendu : une « erreur » dont le message commence par
--     SELFTEST OK
-- (c'est volontaire : l'erreur finale force l'annulation des données de test).
-- Si le message commence par ÉCHEC, copie-le-moi tel quel.
-- ============================================================

do $$
declare
  v_token text := 'selftest-' || gen_random_uuid()::text;
  v_ref   text := 'trx.selftest' || substr(gen_random_uuid()::text, 1, 8);
  v_tpl   text := 'cv_executif_moderne';
  r       jsonb;
  v_pid   uuid;
  v_nonce text;
  i       integer;
begin
  insert into public.pending_purchases
    (purchase_token, template_id, guest_email, guest_phone, amount, payment_method, status)
  values
    (v_token, v_tpl, 'selftest@takidoc.test', '060000000', 1000, 'notchpay', 'pending');

  -- 1. Montant erroné refusé
  r := public.complete_purchase(v_token, v_ref, 999, 'XAF', 'notchpay');
  if r->>'error' is distinct from 'amount_mismatch' then
    raise exception 'ÉCHEC 1 : un montant erroné a été accepté -> %', r;
  end if;

  -- 2. Devise erronée refusée
  r := public.complete_purchase(v_token, v_ref, 1000, 'USD', 'notchpay');
  if r->>'error' is distinct from 'currency_mismatch' then
    raise exception 'ÉCHEC 2 : une devise erronée a été acceptée -> %', r;
  end if;

  -- 3. Paiement correct accepté
  r := public.complete_purchase(v_token, v_ref, 1000, 'XAF', 'notchpay');
  if (r->>'ok')::boolean is not true or (r->>'idempotent')::boolean is not false then
    raise exception 'ÉCHEC 3 : paiement correct refusé -> %', r;
  end if;
  v_pid := (r->>'purchase_id')::uuid;

  -- 4. Idempotence : un 2e webhook ne crée rien de plus
  r := public.complete_purchase(v_token, v_ref, 1000, 'XAF', 'notchpay');
  if (r->>'idempotent')::boolean is not true or (r->>'purchase_id')::uuid is distinct from v_pid then
    raise exception 'ÉCHEC 4 : idempotence non respectée -> %', r;
  end if;
  if (select count(*) from public.purchases where payment_reference = v_ref) <> 1 then
    raise exception 'ÉCHEC 4b : achat en double';
  end if;

  -- 5. Le document utilisateur a été créé
  if not exists (select 1 from public.user_documents where purchase_id = v_pid) then
    raise exception 'ÉCHEC 5 : user_documents non créé';
  end if;

  -- 6. Création d'un nonce (quota : 5 -> reste 4)
  r := public.create_generation_nonce(v_pid, 'pdf');
  if (r->>'ok')::boolean is not true or (r->>'remaining')::integer <> 4 then
    raise exception 'ÉCHEC 6 : création du nonce -> %', r;
  end if;
  v_nonce := r->>'nonce';

  -- 7. Mauvais modèle / mauvais format refusés
  if public.validate_and_consume_nonce(v_nonce, 'autre_modele') then
    raise exception 'ÉCHEC 7 : nonce accepté pour un autre modèle';
  end if;
  if public.validate_and_consume_nonce(v_nonce, v_tpl, 'docx') then
    raise exception 'ÉCHEC 7b : nonce PDF accepté pour un DOCX';
  end if;

  -- 8. Validation correcte
  if not public.validate_and_consume_nonce(v_nonce, v_tpl, 'pdf') then
    raise exception 'ÉCHEC 8 : nonce valide refusé';
  end if;

  -- 9. Rejeu refusé
  if public.validate_and_consume_nonce(v_nonce, v_tpl, 'pdf') then
    raise exception 'ÉCHEC 9 : un nonce a pu être utilisé deux fois';
  end if;

  -- 10. Restitution après échec de génération, puis nouvelle utilisation
  if not public.release_generation_nonce(v_nonce) then
    raise exception 'ÉCHEC 10 : restitution du nonce impossible';
  end if;
  if not public.validate_and_consume_nonce(v_nonce, v_tpl, 'pdf') then
    raise exception 'ÉCHEC 10b : nonce restitué inutilisable';
  end if;

  -- 11. Nonce invalide (pas un UUID) refusé sans erreur SQL
  if public.validate_and_consume_nonce('pas-un-uuid', v_tpl) then
    raise exception 'ÉCHEC 11 : nonce invalide accepté';
  end if;

  -- 12. Quota : 4 nonces de plus passent, le 6e est refusé
  for i in 1..4 loop
    r := public.create_generation_nonce(v_pid, 'pdf');
    if (r->>'ok')::boolean is not true then
      raise exception 'ÉCHEC 12 : nonce % refusé trop tôt -> %', i, r;
    end if;
  end loop;
  r := public.create_generation_nonce(v_pid, 'pdf');
  if r->>'error' is distinct from 'quota_exceeded' then
    raise exception 'ÉCHEC 12b : le quota n''est pas appliqué -> %', r;
  end if;

  -- 13. Achat annulé : plus de nonce, et les nonces déjà créés deviennent inutilisables
  update public.purchases set payment_status = 'void' where id = v_pid;

  r := public.create_generation_nonce(v_pid, 'pdf');
  if r->>'error' is distinct from 'not_paid' then
    raise exception 'ÉCHEC 13 : nonce créé pour un achat annulé -> %', r;
  end if;

  select nonce::text into v_nonce
    from public.generation_nonces
   where purchase_id = v_pid and used = false
   limit 1;

  if public.validate_and_consume_nonce(v_nonce, v_tpl, 'pdf') then
    raise exception 'ÉCHEC 13b : nonce accepté pour un achat annulé';
  end if;

  -- Tout est bon : on annule volontairement pour ne rien garder en base
  raise exception 'SELFTEST OK : 13 contrôles réussis (données de test annulées)';
end $$;
