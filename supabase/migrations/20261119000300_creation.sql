-- Phase 3 : projets, designs, versions, assets (CDC §5.1-5.3).
-- Chaque ressource privée porte un workspace_id : une seule règle RLS couvre B2C et B2B.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','archived','deleted')),
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  project_id uuid not null references public.projects on delete cascade,
  model_version_id uuid not null references public.garment_model_versions,
  name text not null,
  document jsonb not null,
  revision int not null default 1,
  review_status text not null default 'draft'
    check (review_status in ('draft','submitted','approved','changes_requested')),
  thumbnail_path text,
  created_by uuid references public.profiles,
  updated_by uuid references public.profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Corbeille : un design supprimé reste récupérable jusqu'à la purge.
  deleted_at timestamptz
);
create index on public.designs (workspace_id, updated_at desc);
create index on public.designs (project_id);

create table public.design_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  revision int not null,
  label text,
  document jsonb not null,
  created_by uuid references public.profiles,
  created_at timestamptz not null default now()
);
create index on public.design_versions (design_id, created_at desc);

create table public.design_variants (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs on delete cascade,
  workspace_id uuid not null references public.workspaces on delete cascade,
  label text not null,
  player jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  kind text not null default 'image' check (kind in ('image','logo','font','texture')),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/svg+xml')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  width int,
  height int,
  storage_path text not null,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);
create index on public.assets (workspace_id, created_at desc);

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  colors text[] not null default '{}',
  fonts text[] not null default '{}',
  logo_asset_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Sauvegarde automatique : contrôle de concurrence par `revision` (CDC §5.1).
-- Lève 40001 si quelqu'un a enregistré entre-temps ; le client propose alors un choix de version.
create function public.save_design(
  p_id uuid, p_document jsonb, p_expected_revision int, p_name text default null
) returns int language plpgsql security invoker set search_path = public as $$
declare r int;
begin
  update public.designs
     set document = p_document,
         name = coalesce(nullif(trim(p_name), ''), name),
         revision = revision + 1,
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_id and revision = p_expected_revision
   returning revision into r;
  if r is null then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;
  update public.projects set updated_at = now()
   where id = (select project_id from public.designs where id = p_id);
  return r;
end;
$$;

-- Instantané manuel ou automatique de la révision courante.
create function public.snapshot_design(p_id uuid, p_label text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v uuid;
begin
  insert into public.design_versions (design_id, workspace_id, revision, label, document, created_by)
  select d.id, d.workspace_id, d.revision, p_label, d.document, auth.uid()
    from public.designs d where d.id = p_id
  returning id into v;
  if v is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return v;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['projects','designs','design_versions','design_variants','assets','brand_kits']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_member(workspace_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (public.is_member(workspace_id, ''designer''))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.is_member(workspace_id, ''designer'')) with check (public.is_member(workspace_id, ''designer''))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.is_member(workspace_id, ''designer''))', t || '_delete', t);
  end loop;
end $$;

-- Les versions sont immuables.
drop policy design_versions_update on public.design_versions;
