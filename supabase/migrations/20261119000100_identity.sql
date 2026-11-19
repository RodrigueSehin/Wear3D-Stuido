-- Phase 3 : identité et espaces de travail (CDC §5.1, §5.2).

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  locale text not null default 'fr',
  country_code char(2),
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind public.workspace_kind not null,
  name text not null,
  slug text unique not null,
  logo_asset_id uuid,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid references public.workspaces on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role public.member_role not null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  email text not null,
  role public.member_role not null default 'designer',
  token text unique not null default encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid references public.teams on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (team_id, user_id)
);

-- Rôle minimal : owner > admin > designer > reviewer > viewer (ordre de l'enum).
create function public.is_member(ws uuid, min_role public.member_role default 'viewer')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
      and array_position(enum_range(null::public.member_role), m.role)
       <= array_position(enum_range(null::public.member_role), min_role)
  );
$$;

create function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_platform_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Inscription : profil + espace personnel + rôle propriétaire (CDC §5, « espace personnel »).
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  name_ text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Utilisateur'
  );
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id, name_, coalesce(new.raw_user_meta_data ->> 'locale', 'fr'));

  insert into public.workspaces (kind, name, slug, created_by)
  values ('personal', name_, 'u-' || replace(new.id::text, '-', ''), new.id)
  returning id into ws;

  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS -----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy profiles_read on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.workspace_members a
      join public.workspace_members b on b.workspace_id = a.workspace_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- Le drapeau administrateur n'est jamais modifiable depuis le navigateur.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, locale, country_code) on public.profiles to authenticated;

create policy workspaces_read on public.workspaces for select using (public.is_member(id));
create policy workspaces_update on public.workspaces for update
  using (public.is_member(id, 'admin')) with check (public.is_member(id, 'admin'));

create policy members_read on public.workspace_members for select using (public.is_member(workspace_id));
create policy members_insert on public.workspace_members for insert
  with check (public.is_member(workspace_id, 'admin') and role <> 'owner');
create policy members_update on public.workspace_members for update
  using (public.is_member(workspace_id, 'admin'))
  with check (public.is_member(workspace_id, 'admin') and role <> 'owner');
create policy members_delete on public.workspace_members for delete
  using (public.is_member(workspace_id, 'admin') and role <> 'owner');

create policy invitations_all on public.invitations for all
  using (public.is_member(workspace_id, 'admin')) with check (public.is_member(workspace_id, 'admin'));
create policy teams_read on public.teams for select using (public.is_member(workspace_id));
create policy teams_write on public.teams for all
  using (public.is_member(workspace_id, 'admin')) with check (public.is_member(workspace_id, 'admin'));
create policy team_members_read on public.team_members for select
  using (exists (select 1 from public.teams t where t.id = team_id and public.is_member(t.workspace_id)));
create policy team_members_write on public.team_members for all
  using (exists (select 1 from public.teams t where t.id = team_id and public.is_member(t.workspace_id, 'admin')))
  with check (exists (select 1 from public.teams t where t.id = team_id and public.is_member(t.workspace_id, 'admin')));
