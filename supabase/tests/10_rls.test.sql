-- Phase 3 : isolation multi-tenant (CDC §5.3). Un membre de A ne lit aucune ligne de B.
begin;
select plan(17);

-- Deux utilisateurs : le déclencheur crée profil, espace personnel et rôle propriétaire.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com', '{"first_name":"Awa","last_name":"A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@example.com', '{}');

select is((select count(*)::int from public.workspaces), 2, 'un espace personnel par inscription');
select is((select display_name from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Awa A', 'nom issu des métadonnées');
select is((select display_name from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'b', 'repli sur la partie locale de l''email');

-- Modèle 3D minimal pour rattacher un design.
insert into public.garment_categories (id, code, name) values ('cccccccc-0000-0000-0000-00000000000c', 'tests', 'Tests');
insert into public.garment_models (id, category_id, reference, name, is_active)
  values ('dddddddd-0000-0000-0000-00000000000d', 'cccccccc-0000-0000-0000-00000000000c', 'TEST-MODEL', 'Test', true);
insert into public.garment_model_versions (id, garment_model_id, version, version_key, glb_path, sizes)
  values ('eeeeeeee-0000-0000-0000-00000000000e', 'dddddddd-0000-0000-0000-00000000000d', 1, 'test-model@1', '/m.glb', '{M}');

-- A crée un projet et un design dans son espace.
create temp table ws_a as select workspace_id id from public.workspace_members where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
grant select on ws_a to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

insert into public.projects (id, workspace_id, name, created_by)
  values ('11111111-0000-0000-0000-000000000001', (select id from ws_a), 'P', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.designs (id, workspace_id, project_id, model_version_id, name, document)
  values ('22222222-0000-0000-0000-000000000002', (select id from ws_a), '11111111-0000-0000-0000-000000000001',
          'eeeeeeee-0000-0000-0000-00000000000e', 'D', '{"v":1}');

select is((select count(*)::int from public.designs), 1, 'A voit son design');
select is(public.save_design('22222222-0000-0000-0000-000000000002', '{"v":2}', 1), 2, 'save_design incrémente la révision');
select throws_ok(
  $$select public.save_design('22222222-0000-0000-0000-000000000002', '{"v":3}', 1)$$,
  '40001', 'revision_conflict', 'une révision périmée est refusée');
select isnt(public.snapshot_design('22222222-0000-0000-0000-000000000002', 'v2'), null, 'instantané créé');
select is((select count(*)::int from public.design_versions), 1, 'A voit son instantané');

-- B ne voit rien de A.
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from public.designs), 0, 'B ne lit aucun design de A');
select is((select count(*)::int from public.projects), 0, 'B ne lit aucun projet de A');
select is((select count(*)::int from public.design_versions), 0, 'B ne lit aucune version de A');
select is((select count(*)::int from public.workspaces), 1, 'B ne voit que son espace');
select throws_ok(
  $$insert into public.projects (workspace_id, name, created_by) select id, 'X', 'bbbbbbbb-0000-0000-0000-000000000002' from ws_a$$,
  '42501', null, 'B ne peut pas écrire dans l''espace de A');
update public.designs set name = 'pirate' where id = '22222222-0000-0000-0000-000000000002';

-- Le drapeau administrateur n'est pas modifiable depuis le navigateur.
select throws_ok(
  $$update public.profiles set is_platform_admin = true where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$,
  '42501', null, 'is_platform_admin protégé');

-- Catalogue : lecture publique des modèles actifs.
select ok((select count(*) from public.garment_models) >= 1, 'catalogue actif lisible');
select throws_ok(
  $$insert into public.garment_categories (code, name) values ('x', 'X')$$,
  '42501', null, 'écriture du catalogue réservée à l''administration');

-- A relit son design : la tentative de B n'a rien modifié.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select name from public.designs where id = '22222222-0000-0000-0000-000000000002'), 'D', 'B ne modifie pas le design de A');

select * from finish();
rollback;
