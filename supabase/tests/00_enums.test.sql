-- Tests pgTAP (exécutés par `pnpm db:test`). Les tests RLS arrivent en phase 3.
begin;
select plan(3);

select has_type('public', 'workspace_kind', 'type workspace_kind présent');
select has_type('public', 'member_role', 'type member_role présent');
select has_type('public', 'job_status', 'type job_status présent');

select * from finish();
rollback;
