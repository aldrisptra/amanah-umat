-- =============================================================
--  BAGIAN TAMBAHAN HALAMAN TENTANG KAMI
--
--   1. about_values     -> kartu "Nilai Kami"
--   2. about_milestones -> garis waktu "Perjalanan Kami"
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Sebelum tabel ini dibuat, halaman Tentang Kami tetap tampil
--  normal; kedua bagian tersebut hanya belum muncul.
-- =============================================================

-- -------------------------------------------------------------
--  1. NILAI KAMI
-- -------------------------------------------------------------

create table if not exists public.about_values (
  id          bigint generated always as identity primary key,
  icon        text not null default 'heart',
  title       text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.about_values enable row level security;

-- -------------------------------------------------------------
--  2. PERJALANAN KAMI (garis waktu)
-- -------------------------------------------------------------

create table if not exists public.about_milestones (
  id          bigint generated always as identity primary key,
  -- Disimpan sebagai teks, bukan angka, agar bisa diisi "2010",
  -- "2010-2015", atau "Sejak awal".
  year        text not null,
  title       text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.about_milestones enable row level security;

-- -------------------------------------------------------------
--  KEBIJAKAN AKSES
--
--  Pola sama dengan tabel lain: siapa pun boleh MEMBACA,
--  hanya admin yang sudah login boleh MENGUBAH.
-- -------------------------------------------------------------

do $$
declare
  nama_tabel text;
begin
  foreach nama_tabel in array array['about_values', 'about_milestones'] loop

    execute format(
      'drop policy if exists "%1$s_baca_publik" on public.%1$I', nama_tabel);
    execute format(
      'create policy "%1$s_baca_publik" on public.%1$I
         for select to anon, authenticated using (true)', nama_tabel);

    execute format(
      'drop policy if exists "%1$s_tambah_admin" on public.%1$I', nama_tabel);
    execute format(
      'create policy "%1$s_tambah_admin" on public.%1$I
         for insert to authenticated with check (true)', nama_tabel);

    execute format(
      'drop policy if exists "%1$s_ubah_admin" on public.%1$I', nama_tabel);
    execute format(
      'create policy "%1$s_ubah_admin" on public.%1$I
         for update to authenticated using (true) with check (true)',
      nama_tabel);

    execute format(
      'drop policy if exists "%1$s_hapus_admin" on public.%1$I', nama_tabel);
    execute format(
      'create policy "%1$s_hapus_admin" on public.%1$I
         for delete to authenticated using (true)', nama_tabel);

  end loop;
end $$;

-- -------------------------------------------------------------
--  CONTOH ISI AWAL
--
--  Silakan ubah atau hapus lewat panel admin. Bagian ini hanya
--  dijalankan bila tabelnya masih kosong, sehingga aman diulang.
-- -------------------------------------------------------------

insert into public.about_values (icon, title, description, sort_order)
select * from (values
  ('heart',     'Kasih Sayang', 'Anak-anak tumbuh dalam lingkungan yang hangat, diperhatikan, dan didengar.', 1),
  ('book',      'Pendidikan',   'Mendampingi pendidikan formal maupun pembinaan akhlak setiap hari.', 2),
  ('shield',    'Amanah',       'Setiap bantuan dikelola dengan jujur dan dilaporkan sebagaimana mestinya.', 3),
  ('sprout',    'Kemandirian',  'Membekali anak-anak keterampilan agar siap menghadapi masa depan.', 4)
) as contoh(icon, title, description, sort_order)
where not exists (select 1 from public.about_values);
