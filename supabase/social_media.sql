-- =============================================================
--  MEDIA SOSIAL YAYASAN (Instagram & YouTube)
--
--  Menambahkan dua kolom pada tabel `contact` yang sudah ada,
--  sehingga tautan media sosial bisa diisi lewat menu Kontak
--  di panel admin dan tampil di halaman Kontak serta bagian
--  bawah setiap halaman.
--
--  Jalankan sekali saja melalui:
--  Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
--
--  Aman dijalankan berulang kali: kolom yang sudah ada tidak
--  akan dibuat ulang, dan isinya tidak tersentuh.
--
--  Sebelum berkas ini dijalankan, website tetap berjalan normal -
--  bagian media sosial hanya belum muncul.
-- =============================================================

alter table public.contact
  add column if not exists instagram text,
  add column if not exists youtube   text;

-- -------------------------------------------------------------
--  Tidak ada kebijakan akses baru yang perlu dibuat.
--
--  Kedua kolom ini menumpang tabel `contact` yang kebijakan RLS-nya
--  sudah ada: siapa pun boleh MEMBACA, hanya admin yang sudah login
--  boleh MENGUBAH.
-- -------------------------------------------------------------

-- -------------------------------------------------------------
--  CATATAN PENGISIAN
--
--  Kolom ini boleh diisi dengan salah satu bentuk berikut:
--    - nama akun saja      : amanahummat
--    - dengan tanda @      : @amanahummat
--    - tautan lengkap      : https://www.instagram.com/amanahummat
--
--  Website akan mengubahnya sendiri menjadi tautan yang benar,
--  jadi pengurus tidak perlu menghafal bentuk tautannya.
-- -------------------------------------------------------------
