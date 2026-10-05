-- =============================================================
--  UNIT LEMBAGA (LKSA & TPQ)
--
--  Amanah Ummat menaungi dua unit yang berbagi satu lokasi namun
--  menjalankan program yang berbeda, dengan anak binaan yang hanya
--  sebagian beririsan: ada anak yang mengikuti keduanya, ada yang
--  hanya di LKSA, ada pula yang hanya di TPQ.
--
--  Sebelum ini seluruh isi website ditulis seolah hanya ada satu
--  lembaga, bahkan TPQ sempat terdaftar sebagai salah satu PROGRAM
--  di bawah LKSA.
--
--  Berkas ini:
--    1. Membuat tabel units
--    2. Mengisinya dengan LKSA dan TPQ
--    3. Menambah kolom unit pada programs dan gallery
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Sebelum berkas ini dijalankan, website tetap tampil normal:
--  penanda unit, tombol saring, dan bagian "Unit Kami" hanya belum
--  muncul.
-- =============================================================

-- -------------------------------------------------------------
--  1. TABEL UNIT
-- -------------------------------------------------------------

create table if not exists public.units (
  id bigint generated always as identity primary key,

  -- slug adalah penanda yang disimpan pada tabel programs dan gallery.
  -- Nama boleh diubah kapan saja; slug sebaiknya TIDAK diubah, karena
  -- mengubahnya memutus kaitan dengan program dan foto yang sudah
  -- terlanjur ditandai.
  slug text not null unique,

  -- Dipakai sebagai label kecil pada kartu program dan foto
  short_name text not null,

  -- Nama lengkap, dipakai pada bagian "Unit Kami" di Tentang Kami
  name text not null,

  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.units enable row level security;

-- -------------------------------------------------------------
--  KEBIJAKAN AKSES
--
--  Pola sama dengan tabel lain: siapa pun boleh MEMBACA,
--  hanya admin yang sudah login boleh MENGUBAH.
-- -------------------------------------------------------------

drop policy if exists "units_baca_publik" on public.units;
create policy "units_baca_publik"
  on public.units
  for select
  to anon, authenticated
  using (true);

drop policy if exists "units_tambah_admin" on public.units;
create policy "units_tambah_admin"
  on public.units
  for insert
  to authenticated
  with check (true);

drop policy if exists "units_ubah_admin" on public.units;
create policy "units_ubah_admin"
  on public.units
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "units_hapus_admin" on public.units;
create policy "units_hapus_admin"
  on public.units
  for delete
  to authenticated
  using (true);

-- -------------------------------------------------------------
--  2. ISI AWAL
--
--  PERHATIAN: nama lengkap dan penjelasan di bawah ini masih
--  RANCANGAN. Sesuaikan dengan nama resmi dari pihak yayasan
--  memakai perintah pada bagian 4 di bawah sebelum dianggap final.
--
--  Hanya dijalankan bila tabelnya masih kosong, sehingga aman
--  diulang tanpa menimpa perubahan yang sudah dilakukan.
-- -------------------------------------------------------------

insert into public.units (slug, short_name, name, description, sort_order)
select *
from (values
  (
    'lksa',
    'LKSA',
    'Lembaga Kesejahteraan Sosial Anak (LKSA) Amanah Ummat',
    'Unit pengasuhan dan pembinaan anak. Menaungi anak yatim, piatu, yatim piatu, serta anak dari keluarga kurang mampu yang tinggal dan dibina di asrama Amanah Ummat.',
    1
  ),
  (
    'tpq',
    'TPQ',
    'Taman Pendidikan Qur''an (TPQ) Amanah Ummat',
    'Unit pendidikan Al-Qur''an. Diikuti anak binaan LKSA maupun anak dari lingkungan sekitar, dengan kegiatan belajar membaca, menghafal, dan memahami Al-Qur''an.',
    2
  )
) as bawaan(slug, short_name, name, description, sort_order)
where not exists (select 1 from public.units);

-- -------------------------------------------------------------
--  3. PENANDA UNIT PADA PROGRAM DAN FOTO
--
--  Sengaja berupa teks biasa tanpa kaitan paksa (foreign key) ke
--  tabel units, supaya menghapus satu unit tidak ikut menghapus
--  atau mengunci program dan foto yang sudah ada. Penanda yang
--  tidak dikenali cukup diabaikan oleh website.
--
--  Nilai yang dipakai:
--    'lksa'      -> hanya LKSA
--    'tpq'       -> hanya TPQ
--    'keduanya'  -> berlaku untuk kedua unit
--    NULL        -> belum ditandai (tetap tampil di pilihan "Semua")
--
--  Semua baris lama sengaja dibiarkan NULL. Penandaannya diserahkan
--  kepada pengurus lewat panel admin, karena hanya mereka yang tahu
--  program mana milik unit mana.
-- -------------------------------------------------------------

alter table public.programs add column if not exists unit text;
alter table public.gallery  add column if not exists unit text;

-- -------------------------------------------------------------
--  4. MENGUBAH NAMA UNIT (jalankan bila nama resminya sudah pasti)
--
--  Ubah teksnya seperlunya, lalu jalankan baris yang diperlukan
--  saja. Jangan mengubah kolom slug.
-- -------------------------------------------------------------

-- update public.units
-- set short_name  = 'LKSA',
--     name        = 'ISI NAMA RESMI LKSA DI SINI',
--     description = 'ISI PENJELASAN SINGKAT DI SINI'
-- where slug = 'lksa';

-- update public.units
-- set short_name  = 'TPQ',
--     name        = 'ISI NAMA RESMI TPQ DI SINI',
--     description = 'ISI PENJELASAN SINGKAT DI SINI'
-- where slug = 'tpq';

-- -------------------------------------------------------------
--  5. PERIKSA HASIL
-- -------------------------------------------------------------

select slug, short_name, name, sort_order from public.units order by sort_order;
