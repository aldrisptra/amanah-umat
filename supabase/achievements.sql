-- =============================================================
--  TABEL PRESTASI / PENGHARGAAN
--
--  Mengaktifkan halaman publik "Prestasi" (/prestasi) beserta
--  menu pengelolaannya di panel admin.
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Sebelum tabel ini dibuat, website tetap berjalan normal:
--  halaman Prestasi tampil dengan keterangan "belum tersedia",
--  dan menu Prestasi di panel admin menampilkan petunjuk ini.
-- =============================================================

create table if not exists public.achievements (
  id          bigint generated always as identity primary key,
  title       text not null,
  -- Disimpan sebagai teks, bukan angka, agar bisa diisi "2024",
  -- "2023-2024", atau keterangan singkat lain.
  year        text not null default '',
  -- Mis. Akademik, Tahfidz, Olahraga, Kelembagaan. Dipakai sebagai
  -- tombol penyaring di halaman publik.
  category    text not null default '',
  -- Pihak yang memberikan penghargaan, mis. "Dinas Sosial Balikpapan"
  organizer   text not null default '',
  description text not null default '',
  -- Boleh kosong: tidak semua prestasi punya foto piagam/dokumentasi
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.achievements enable row level security;

-- -------------------------------------------------------------
--  KEBIJAKAN AKSES
--
--  Pola sama dengan tabel lain di proyek ini: siapa pun boleh
--  MEMBACA, hanya admin yang sudah login boleh MENGUBAH.
-- -------------------------------------------------------------

drop policy if exists "achievements_baca_publik" on public.achievements;
create policy "achievements_baca_publik"
  on public.achievements
  for select
  to anon, authenticated
  using (true);

drop policy if exists "achievements_tambah_admin" on public.achievements;
create policy "achievements_tambah_admin"
  on public.achievements
  for insert
  to authenticated
  with check (true);

drop policy if exists "achievements_ubah_admin" on public.achievements;
create policy "achievements_ubah_admin"
  on public.achievements
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "achievements_hapus_admin" on public.achievements;
create policy "achievements_hapus_admin"
  on public.achievements
  for delete
  to authenticated
  using (true);

-- -------------------------------------------------------------
--  CONTOH ISI AWAL
--
--  Silakan ubah atau hapus lewat panel admin. Bagian ini hanya
--  dijalankan bila tabelnya masih kosong, sehingga aman diulang.
-- -------------------------------------------------------------

insert into public.achievements
  (title, year, category, organizer, description, sort_order)
select * from (values
  (
    'Juara 1 Musabaqah Hifzhil Quran Tingkat Kota',
    '2024',
    'Tahfidz',
    'Kementerian Agama Kota Balikpapan',
    'Ananda asuh LKSA Amanah Ummat meraih juara pertama pada cabang hafalan 5 juz tingkat Kota Balikpapan.',
    1
  ),
  (
    'Lembaga Kesejahteraan Sosial Anak Terakreditasi',
    '2023',
    'Kelembagaan',
    'Badan Akreditasi Lembaga Kesejahteraan Sosial',
    'Pengakuan atas pengelolaan lembaga, pendampingan anak, dan tertib administrasi yang memenuhi standar nasional.',
    2
  ),
  (
    'Juara 2 Lomba Cerdas Cermat Antar Panti',
    '2023',
    'Akademik',
    'Dinas Sosial Kota Balikpapan',
    'Tim anak asuh meraih juara kedua pada lomba cerdas cermat yang diikuti panti se-Kota Balikpapan.',
    3
  )
) as contoh(title, year, category, organizer, description, sort_order)
where not exists (select 1 from public.achievements);
