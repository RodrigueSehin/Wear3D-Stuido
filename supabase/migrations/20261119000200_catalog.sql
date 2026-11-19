-- Phase 3 : catalogue géré par l'administration (CDC §5.1). Lecture publique des lignes actives.

create table public.garment_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.garment_models (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.garment_categories,
  reference text unique not null,
  name text not null,
  description text,
  required_plan text not null default 'free',
  current_version_id uuid,
  is_active boolean not null default false
);

create table public.garment_model_versions (
  id uuid primary key default gen_random_uuid(),
  garment_model_id uuid not null references public.garment_models on delete cascade,
  version int not null,
  -- Identifiant stable référencé par les documents de design (ex. « tshirt-classic@1 »).
  version_key text unique not null,
  glb_path text not null,
  uv_template_path text,
  sizes text[] not null,
  morph_states text[] not null default '{}',
  config jsonb not null default '{}',
  unique (garment_model_id, version)
);
alter table public.garment_models
  add constraint garment_models_current_version_fk
  foreign key (current_version_id) references public.garment_model_versions on delete set null;

create table public.garment_zones (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.garment_model_versions on delete cascade,
  code text not null,
  mesh_name text not null,
  label text not null,
  uv_rect jsonb not null,
  print_area_mm jsonb,
  allows text[] not null,
  sort_order int not null default 0,
  unique (model_version_id, code)
);

create table public.materials (
  code text primary key,
  name text not null,
  config jsonb not null default '{}',
  is_active boolean not null default true
);

create table public.garment_model_materials (
  model_version_id uuid references public.garment_model_versions on delete cascade,
  material_code text references public.materials,
  primary key (model_version_id, material_code)
);

create table public.fonts (
  key text primary key,
  family text not null,
  label text not null,
  is_active boolean not null default true
);

do $$
declare t text;
begin
  foreach t in array array['garment_categories','garment_models','garment_model_versions','garment_zones','materials','garment_model_materials','fonts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all using (public.is_platform_admin()) with check (public.is_platform_admin())', t || '_admin', t);
  end loop;
end $$;

create policy categories_read on public.garment_categories for select using (is_active);
create policy models_read on public.garment_models for select using (is_active);
create policy versions_read on public.garment_model_versions for select
  using (exists (select 1 from public.garment_models m where m.id = garment_model_id and m.is_active));
create policy zones_read on public.garment_zones for select
  using (exists (
    select 1 from public.garment_model_versions v join public.garment_models m on m.id = v.garment_model_id
    where v.id = model_version_id and m.is_active));
create policy materials_read on public.materials for select using (is_active);
create policy model_materials_read on public.garment_model_materials for select using (true);
create policy fonts_read on public.fonts for select using (is_active);
