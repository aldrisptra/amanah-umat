-- Membersihkan baris kontak yang menumpuk.
--
-- Tabel contact seharusnya hanya berisi SATU baris. Saat ini ada tiga, sisa
-- percobaan penyimpanan di awal pembuatan panel. Website (halaman Kontak,
-- footer, maupun panel pengelola) sama-sama membaca baris terbaru dengan
--
--     .order("created_at", { ascending: false }).limit(1)
--
-- jadi yang tampil selalu baris id 3. Dua baris lain tidak merusak apa pun,
-- tetapi menyesatkan siapa pun yang kelak membuka tabel ini lewat Supabase
-- dan mengira nomor atau email di baris lama itu yang dipakai.
--
-- Jalankan di Supabase -> SQL Editor.

-- 1. Periksa dulu. Pastikan baris paling atas memang data yang benar.
select id, created_at, email, phone, instagram, youtube
from public.contact
order by created_at desc;

-- 2. Bila baris teratas sudah benar, hapus sisanya.
--    Perintah ini menyisakan tepat satu baris, yaitu yang paling baru.
delete from public.contact
where created_at < (select max(created_at) from public.contact);

-- 3. Pastikan tinggal satu baris.
select count(*) as jumlah_baris from public.contact;
