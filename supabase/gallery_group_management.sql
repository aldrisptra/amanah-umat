-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Kelompok galeri terpisah dari unit lembaga dan kategori kegiatan program.
begin;
alter table public.gallery add column if not exists unit text;
create table if not exists public.gallery_groups (
  slug text primary key check (slug = lower(slug) and slug not in ('Semua', 'semua', 'keduanya')),
  name text not null check (length(trim(name)) between 1 and 60 and lower(trim(name)) <> 'semua'),
  created_at timestamptz not null default now()
);
create unique index if not exists gallery_groups_unique_name on public.gallery_groups (lower(trim(name)));
alter table public.gallery_groups enable row level security;
drop policy if exists gallery_groups_read on public.gallery_groups;
create policy gallery_groups_read on public.gallery_groups for select to anon, authenticated using (true);
drop policy if exists gallery_groups_insert on public.gallery_groups;
create policy gallery_groups_insert on public.gallery_groups for insert to authenticated with check (true);
drop policy if exists gallery_groups_update on public.gallery_groups;
create policy gallery_groups_update on public.gallery_groups for update to authenticated using (true) with check (true);
drop policy if exists gallery_groups_delete on public.gallery_groups;
create policy gallery_groups_delete on public.gallery_groups for delete to authenticated using (true);
insert into public.gallery_groups (slug, name) values ('tpq', 'TPQ'), ('lksa', 'LKSA') on conflict do nothing;
-- Pertahankan kelompok yang sebelumnya sudah tersimpan pada foto.
insert into public.gallery_groups (slug, name)
select distinct lower(trim(unit)), trim(unit) from public.gallery
where nullif(trim(unit), '') is not null and lower(trim(unit)) not in ('tpq', 'lksa', 'keduanya', 'semua', '__unassigned')
on conflict do nothing;
-- Penanda eksplisit mempertahankan pengelompokan foto lama dari keterangannya.
update public.gallery set unit = case
 when concat_ws(' ', category, alt_text) ~* '\mTPQ\M' and concat_ws(' ', category, alt_text) ~* '\mLKSA\M' then 'keduanya'
 when concat_ws(' ', category, alt_text) ~* '\mTPQ\M' then 'tpq'
 when concat_ws(' ', category, alt_text) ~* '\mLKSA\M' then 'lksa'
end where nullif(trim(unit), '') is null;
-- Tidak ada cascade: menghapus kelompok tidak menghapus atau mengubah foto.
notify pgrst, 'reload schema';
commit;
