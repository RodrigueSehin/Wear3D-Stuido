-- Généré par `pnpm --filter @wear3d/garment-engine generate`. Ne pas modifier à la main.

insert into public.garment_categories (code, name, sort_order) values ('tshirts', 'T-shirts', 0) on conflict (code) do nothing;
insert into public.garment_categories (code, name, sort_order) values ('football', 'Maillots de football', 1) on conflict (code) do nothing;
insert into public.garment_categories (code, name, sort_order) values ('hoodies', 'Hoodies', 2) on conflict (code) do nothing;

insert into public.garment_models (category_id, reference, name, is_active)
  select id, 'TS-CLASSIC', 'T-shirt col rond', true from public.garment_categories where code = 'tshirts'
  on conflict (reference) do nothing;
insert into public.garment_model_versions (garment_model_id, version, version_key, glb_path, sizes, config)
  select id, 1, 'tshirt-classic@1', '/garments/tshirt-classic/v1/model.glb', array['XS','S','M','L','XL','XXL']::text[], '{"materials":["cotton","polyester","poly-sport","elastane","sport-mesh","technical","microfiber","honeycomb","knit","satin","carbon"],"trims":{"cuffs":{"zones":["SLEEVE_LEFT","SLEEVE_RIGHT"],"edge":"bottom","defaultWidth":0.12,"sleeveLengthCm":22}}}'::jsonb
  from public.garment_models where reference = 'TS-CLASSIC'
  on conflict (version_key) do nothing;
update public.garment_models m set current_version_id = v.id
  from public.garment_model_versions v where v.garment_model_id = m.id and v.version_key = 'tshirt-classic@1';
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_FRONT', 'Zone_Body_Front', 'Devant', '{"x":0.0078125,"y":0.0078125,"w":0.48828125,"h":0.62}'::jsonb, '{"w":300,"h":400}'::jsonb, array['color','material','pattern','text','image']::text[], 0
  from public.garment_model_versions where version_key = 'tshirt-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_BACK', 'Zone_Body_Back', 'Dos', '{"x":0.50390625,"y":0.0078125,"w":0.48828125,"h":0.62}'::jsonb, '{"w":300,"h":450}'::jsonb, array['color','material','pattern','text','image']::text[], 1
  from public.garment_model_versions where version_key = 'tshirt-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_LEFT', 'Zone_Sleeve_Left', 'Manche gauche', '{"x":0.0078125,"y":0.635625,"w":0.48828125,"h":0.2}'::jsonb, '{"w":100,"h":100}'::jsonb, array['color','material','pattern','text','image']::text[], 2
  from public.garment_model_versions where version_key = 'tshirt-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_RIGHT', 'Zone_Sleeve_Right', 'Manche droite', '{"x":0.50390625,"y":0.635625,"w":0.48828125,"h":0.2}'::jsonb, '{"w":100,"h":100}'::jsonb, array['color','material','pattern','text','image']::text[], 3
  from public.garment_model_versions where version_key = 'tshirt-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'COLLAR', 'Zone_Collar', 'Col', '{"x":0.0078125,"y":0.8434375,"w":0.984375,"h":0.06}'::jsonb, null, array['color','material','text','image']::text[], 4
  from public.garment_model_versions where version_key = 'tshirt-classic@1'
  on conflict (model_version_id, code) do nothing;

insert into public.garment_models (category_id, reference, name, is_active)
  select id, 'FB-JERSEY', 'Maillot de football', true from public.garment_categories where code = 'football'
  on conflict (reference) do nothing;
insert into public.garment_model_versions (garment_model_id, version, version_key, glb_path, sizes, config)
  select id, 1, 'football-jersey@1', '/garments/football-jersey/v1/model.glb', array['XS','S','M','L','XL','XXL']::text[], '{"materials":["poly-sport","polyester","sport-mesh","technical","microfiber","honeycomb"],"trims":{"cuffs":{"zones":["SLEEVE_LEFT","SLEEVE_RIGHT"],"edge":"bottom","defaultWidth":0.1,"sleeveLengthCm":18}}}'::jsonb
  from public.garment_models where reference = 'FB-JERSEY'
  on conflict (version_key) do nothing;
update public.garment_models m set current_version_id = v.id
  from public.garment_model_versions v where v.garment_model_id = m.id and v.version_key = 'football-jersey@1';
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_FRONT', 'Zone_Body_Front', 'Devant', '{"x":0.0078125,"y":0.0078125,"w":0.48828125,"h":0.6}'::jsonb, '{"w":300,"h":420}'::jsonb, array['color','material','pattern','text','image']::text[], 0
  from public.garment_model_versions where version_key = 'football-jersey@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_BACK', 'Zone_Body_Back', 'Dos', '{"x":0.50390625,"y":0.0078125,"w":0.48828125,"h":0.6}'::jsonb, '{"w":320,"h":480}'::jsonb, array['color','material','pattern','text','image']::text[], 1
  from public.garment_model_versions where version_key = 'football-jersey@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_LEFT', 'Zone_Sleeve_Left', 'Manche gauche', '{"x":0.0078125,"y":0.615625,"w":0.48828125,"h":0.22}'::jsonb, '{"w":110,"h":100}'::jsonb, array['color','material','pattern','text','image']::text[], 2
  from public.garment_model_versions where version_key = 'football-jersey@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_RIGHT', 'Zone_Sleeve_Right', 'Manche droite', '{"x":0.50390625,"y":0.615625,"w":0.48828125,"h":0.22}'::jsonb, '{"w":110,"h":100}'::jsonb, array['color','material','pattern','text','image']::text[], 3
  from public.garment_model_versions where version_key = 'football-jersey@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'COLLAR', 'Zone_Collar', 'Col', '{"x":0.0078125,"y":0.8434375,"w":0.984375,"h":0.06}'::jsonb, null, array['color','material','text','image']::text[], 4
  from public.garment_model_versions where version_key = 'football-jersey@1'
  on conflict (model_version_id, code) do nothing;

insert into public.garment_models (category_id, reference, name, is_active)
  select id, 'HD-CLASSIC', 'Hoodie à capuche', true from public.garment_categories where code = 'hoodies'
  on conflict (reference) do nothing;
insert into public.garment_model_versions (garment_model_id, version, version_key, glb_path, sizes, config)
  select id, 1, 'hoodie-classic@1', '/garments/hoodie-classic/v1/model.glb', array['XS','S','M','L','XL','XXL']::text[], '{"materials":["cotton","polyester","elastane","knit","microfiber","technical"],"trims":{"cuffs":{"zones":["SLEEVE_LEFT","SLEEVE_RIGHT"],"edge":"bottom","defaultWidth":0.1,"sleeveLengthCm":60}}}'::jsonb
  from public.garment_models where reference = 'HD-CLASSIC'
  on conflict (version_key) do nothing;
update public.garment_models m set current_version_id = v.id
  from public.garment_model_versions v where v.garment_model_id = m.id and v.version_key = 'hoodie-classic@1';
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_FRONT', 'Zone_Body_Front', 'Devant', '{"x":0.0078125,"y":0.0078125,"w":0.48828125,"h":0.6}'::jsonb, '{"w":320,"h":380}'::jsonb, array['color','material','pattern','text','image']::text[], 0
  from public.garment_model_versions where version_key = 'hoodie-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'BODY_BACK', 'Zone_Body_Back', 'Dos', '{"x":0.50390625,"y":0.0078125,"w":0.48828125,"h":0.6}'::jsonb, '{"w":340,"h":500}'::jsonb, array['color','material','pattern','text','image']::text[], 1
  from public.garment_model_versions where version_key = 'hoodie-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_LEFT', 'Zone_Sleeve_Left', 'Manche gauche', '{"x":0.0078125,"y":0.615625,"w":0.48828125,"h":0.24}'::jsonb, '{"w":110,"h":400}'::jsonb, array['color','material','pattern','text','image']::text[], 2
  from public.garment_model_versions where version_key = 'hoodie-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'SLEEVE_RIGHT', 'Zone_Sleeve_Right', 'Manche droite', '{"x":0.50390625,"y":0.615625,"w":0.48828125,"h":0.24}'::jsonb, '{"w":110,"h":400}'::jsonb, array['color','material','pattern','text','image']::text[], 3
  from public.garment_model_versions where version_key = 'hoodie-classic@1'
  on conflict (model_version_id, code) do nothing;
insert into public.garment_zones (model_version_id, code, mesh_name, label, uv_rect, print_area_mm, allows, sort_order)
  select id, 'COLLAR', 'Zone_Collar', 'Capuche', '{"x":0.0078125,"y":0.8634375,"w":0.984375,"h":0.1}'::jsonb, null, array['color','material','text','image']::text[], 4
  from public.garment_model_versions where version_key = 'hoodie-classic@1'
  on conflict (model_version_id, code) do nothing;

