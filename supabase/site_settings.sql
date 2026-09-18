-- =============================================================
--  TABEL IDENTITAS WEBSITE (logo + nama yayasan)
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Sebelum tabel ini dibuat, website tetap berjalan normal dan
--  memakai nama "Amanah Ummat" beserta logo huruf bawaan.
-- =============================================================

create table if not exists public.site_settings (
  id          bigint generated always as identity primary key,
  site_name   text not null default 'Amanah Ummat',
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- -------------------------------------------------------------
--  KEBIJAKAN AKSES
--
--  Polanya sama persis dengan tabel lain di proyek ini:
--  siapa pun boleh MEMBACA (logo tampil di website publik),
--  hanya admin yang sudah login boleh MENGUBAH.
-- -------------------------------------------------------------

drop policy if exists "site_settings_baca_publik" on public.site_settings;
create policy "site_settings_baca_publik"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_tambah_admin" on public.site_settings;
create policy "site_settings_tambah_admin"
  on public.site_settings
  for insert
  to authenticated
  with check (true);

drop policy if exists "site_settings_ubah_admin" on public.site_settings;
create policy "site_settings_ubah_admin"
  on public.site_settings
  for update
  to authenticated
  using (true)
  with check (true);

-- Sengaja TIDAK ada kebijakan DELETE: baris ini adalah identitas
-- website dan tidak boleh terhapus, cukup diubah isinya.

-- -------------------------------------------------------------
--  BARIS AWAL
-- -------------------------------------------------------------

insert into public.site_settings (site_name)
select 'Amanah Ummat'
where not exists (select 1 from public.site_settings);
