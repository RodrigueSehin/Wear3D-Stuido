-- Phase 3 : stockage privé des images importées (CDC S-xx : uploads contrôlés).
-- Chemin : <workspace_id>/<fichier>. Seuls les membres de l'espace lisent ; les designers écrivent.
-- Types et taille sont aussi imposés par le bucket (10 Mo, PNG / JPG / SVG).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', false, 10485760, array['image/png', 'image/jpeg', 'image/svg+xml'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy assets_objects_read on storage.objects for select
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy assets_objects_insert on storage.objects for insert
  with check (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid, 'designer'));
create policy assets_objects_update on storage.objects for update
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid, 'designer'));
create policy assets_objects_delete on storage.objects for delete
  using (bucket_id = 'assets' and public.is_member(((storage.foldername(name))[1])::uuid, 'designer'));
