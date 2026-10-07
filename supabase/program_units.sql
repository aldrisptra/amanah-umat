-- =============================================================
--  HALAMAN PROGRAM PER UNIT (pilihan LKSA / TPQ)
--
--  Halaman /program kini berupa pilihan unit: pengunjung memilih
--  LKSA atau TPQ (masing-masing dengan logonya sendiri), lalu
--  diarahkan ke halaman /program/lksa atau /program/tpq yang
--  hanya berisi program unit tersebut.
--
--  Berkas ini:
--    1. Menambah kolom logo dan teks halaman pada tabel units
--    2. Membuat tabel program_page untuk teks halaman pilihan
--
--  PRASYARAT: jalankan supabase/unit_lembaga.sql lebih dulu,
--  karena berkas ini menambah kolom pada tabel units.
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Aman dijalankan berulang kali.
-- =============================================================

-- -------------------------------------------------------------
--  1. KOLOM TAMBAHAN PADA UNIT
-- -------------------------------------------------------------

-- Logo unit, tampil pada kartu pilihan dan di judul halaman unit.
-- Boleh kosong: selama belum diunggah, website menampilkan kotak
-- hijau berisi nama singkat unit.
alter table public.units add column if not exists logo_url text;

-- Judul dan penjelasan di bagian atas halaman /program/<unit>.
-- Boleh kosong: website memakai "Program <nama singkat>" dan
-- penjelasan unit sebagai gantinya.
alter table public.units add column if not exists page_title text not null default '';
alter table public.units add column if not exists page_description text not null default '';

-- -------------------------------------------------------------
--  2. TEKS HALAMAN PILIHAN PROGRAM (/program)
-- -------------------------------------------------------------

create table if not exists public.program_page (
  id                bigint generated always as identity primary key,
  eyebrow           text not null default 'Program Kami',
  title             text not null default 'Kegiatan untuk tumbuh dan berkembang bersama.',
  description       text not null default '',
  -- Kotak ajakan donasi di bagian bawah halaman program
  cta_title         text not null default 'Dukung kegiatan anak-anak Amanah Ummat.',
  cta_description   text not null default '',
  updated_at        timestamptz not null default now()
);

alter table public.program_page enable row level security;

-- Pola sama dengan tabel lain: siapa pun boleh MEMBACA,
-- hanya admin yang sudah login boleh MENGUBAH.

drop policy if exists "program_page_baca_publik" on public.program_page;
create policy "program_page_baca_publik"
  on public.program_page
  for select
  to anon, authenticated
  using (true);

drop policy if exists "program_page_tambah_admin" on public.program_page;
create policy "program_page_tambah_admin"
  on public.program_page
  for insert
  to authenticated
  with check (true);

drop policy if exists "program_page_ubah_admin" on public.program_page;
create policy "program_page_ubah_admin"
  on public.program_page
  for update
  to authenticated
  using (true)
  with check (true);

-- Sengaja TIDAK ada kebijakan DELETE: cukup satu baris, diubah isinya.

insert into public.program_page (eyebrow, title, description, cta_title, cta_description)
select
  'Program Kami',
  'Kegiatan untuk tumbuh dan berkembang bersama.',
  'Amanah Ummat menaungi dua unit dengan program masing-masing. Pilih unit untuk melihat kegiatannya.',
  'Dukung kegiatan anak-anak Amanah Ummat.',
  'Dukungan dari Anda dapat membantu keberlangsungan berbagai kegiatan dan kebutuhan anak-anak di Amanah Ummat.'
where not exists (select 1 from public.program_page);

-- -------------------------------------------------------------
--  3. PERIKSA HASIL
-- -------------------------------------------------------------

select slug, short_name, logo_url, page_title from public.units order by sort_order;
select * from public.program_page;
