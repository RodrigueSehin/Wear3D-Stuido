-- Phase 3 : collaboration, traitements asynchrones, SaaS (CDC §5.1). Les écritures sensibles
-- (jobs, paiements, crédits, quotas) passent par la clé de service, jamais par le navigateur.

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  design_id uuid not null references public.designs on delete cascade,
  token text unique not null default encode(extensions.gen_random_bytes(18), 'hex'),
  can_comment boolean not null default false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);

create table public.design_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  design_id uuid not null references public.designs on delete cascade,
  status text not null check (status in ('submitted','approved','changes_requested')),
  note text,
  reviewer_id uuid references public.profiles,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  design_id uuid not null references public.designs on delete cascade,
  author_id uuid not null references public.profiles,
  body text not null check (length(body) between 1 and 2000),
  anchor jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  kind text not null check (kind in ('export','ai','image')),
  status public.job_status not null default 'pending',
  input jsonb not null,
  output jsonb,
  error text,
  attempts int not null default 0,
  credits_reserved int not null default 0,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);
create index on public.jobs (workspace_id, status);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  job_id uuid references public.jobs,
  prompt text not null,
  provider text,
  result_asset_id uuid references public.assets,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  design_id uuid references public.designs on delete set null,
  job_id uuid references public.jobs,
  format text not null check (format in ('png','jpg','pdf','glb','plt')),
  storage_path text,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now()
);

create table public.plans (
  code text primary key,
  name text not null,
  price_xof int not null default 0,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.plan_features (
  plan_code text references public.plans on delete cascade,
  feature text,
  value jsonb not null,
  primary key (plan_code, feature)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  plan_code text not null references public.plans,
  status text not null default 'active' check (status in ('active','past_due','canceled','trialing')),
  period_start timestamptz not null default now(),
  period_end timestamptz,
  provider text,
  provider_ref text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  subscription_id uuid references public.subscriptions,
  amount_xof int not null,
  status text not null check (status in ('pending','succeeded','failed','refunded')),
  provider text,
  provider_ref text unique,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  delta int not null,
  reason text not null,
  job_id uuid references public.jobs,
  created_at timestamptz not null default now()
);
create index on public.credit_ledger (workspace_id, created_at desc);

create table public.usage_counters (
  workspace_id uuid references public.workspaces on delete cascade,
  metric text,
  period text,
  used bigint not null default 0,
  primary key (workspace_id, metric, period)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces on delete set null,
  actor_id uuid references public.profiles on delete set null,
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  -- Lecture membre, écriture designer.
  foreach t in array array['share_links','ai_generations','exports']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_member(workspace_id))', t || '_read', t);
    execute format('create policy %I on public.%I for insert with check (public.is_member(workspace_id, ''designer''))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.is_member(workspace_id, ''designer'')) with check (public.is_member(workspace_id, ''designer''))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.is_member(workspace_id, ''designer''))', t || '_delete', t);
  end loop;
  -- Lecture membre seule : écritures par le serveur (clé de service) ou politiques dédiées ci-dessous.
  foreach t in array array['design_reviews','comments','jobs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_member(workspace_id))', t || '_read', t);
  end loop;
  -- Facturation et traçabilité : visibles des administrateurs de l'espace.
  foreach t in array array['subscriptions','payments','credit_ledger','usage_counters','audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (workspace_id is not null and public.is_member(workspace_id, ''admin''))', t || '_read', t);
  end loop;
  -- Offres : lecture publique, écriture réservée à l'administration de la plateforme.
  foreach t in array array['plans','plan_features']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for all using (public.is_platform_admin()) with check (public.is_platform_admin())', t || '_admin', t);
  end loop;
end $$;

create policy design_reviews_insert on public.design_reviews for insert
  with check (public.is_member(workspace_id, 'reviewer') and reviewer_id = auth.uid());
create policy comments_insert on public.comments for insert
  with check (public.is_member(workspace_id, 'reviewer') and author_id = auth.uid());
create policy comments_update on public.comments for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete
  using (author_id = auth.uid() or public.is_member(workspace_id, 'admin'));
