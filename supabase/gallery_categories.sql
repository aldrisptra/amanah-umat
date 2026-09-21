-- =============================================================
--  KATEGORI GALERI FOTO
--
--  Sebelumnya daftar kategori ("Pendidikan", "Keagamaan",
--  "Kebersamaan", "Kegiatan") tertulis di dalam kode program,
--  sehingga hanya bisa diubah oleh pengelola teknis.
--
--  Dengan tabel ini, pengurus dapat menambah, mengubah nama,
--  menghapus, dan mengurutkan kategori sendiri lewat menu
--  Galeri Foto di panel admin.
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Sebelum berkas ini dijalankan, galeri tetap berjalan normal
--  memakai empat kategori bawaan tersebut.
-- =============================================================

create table if not exists public.gallery_categories (
  id         bigint generated always as identity primary key,
  name       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Cegah kategori kembar yang hanya berbeda huruf besar/kecil,
-- misalnya "Kegiatan" dan "kegiatan" - bagi pengunjung keduanya
-- terlihat sama, tetapi akan muncul sebagai dua tombol penyaring.
create unique index if not exists gallery_categories_nama_unik
  on public.gallery_categories (lower(name));

alter table public.gallery_categories enable row level security;

-- -------------------------------------------------------------
--  KEBIJAKAN AKSES
--
--  Pola sama dengan tabel lain: siapa pun boleh MEMBACA,
--  hanya admin yang sudah login boleh MENGUBAH.
-- -------------------------------------------------------------

drop policy if exists "gallery_categories_baca_publik" on public.gallery_categories;
create policy "gallery_categories_baca_publik"
  on public.gallery_categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "gallery_categories_tambah_admin" on public.gallery_categories;
create policy "gallery_categories_tambah_admin"
  on public.gallery_categories
  for insert
  to authenticated
  with check (true);

drop policy if exists "gallery_categories_ubah_admin" on public.gallery_categories;
create policy "gallery_categories_ubah_admin"
  on public.gallery_categories
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "gallery_categories_hapus_admin" on public.gallery_categories;
create policy "gallery_categories_hapus_admin"
  on public.gallery_categories
  for delete
  to authenticated
  using (true);

-- -------------------------------------------------------------
--  ISI AWAL
--
--  Diambil dari kategori yang SUDAH terpakai pada foto-foto yang
--  ada, digabung dengan empat kategori bawaan. Dengan begitu tidak
--  ada foto yang kategorinya tiba-tiba hilang dari daftar pilihan.
--
--  Hanya dijalankan bila tabelnya masih kosong, sehingga aman
--  diulang.
-- -------------------------------------------------------------

insert into public.gallery_categories (name, sort_order)
select nama, row_number() over (order by nama)
from (
  select distinct btrim(category) as nama
  from public.gallery
  where category is not null and btrim(category) <> ''

  union

  select nama
  from (values
    ('Pendidikan'),
    ('Keagamaan'),
    ('Kebersamaan'),
    ('Kegiatan')
  ) as bawaan(nama)
) as gabungan
where not exists (select 1 from public.gallery_categories);
