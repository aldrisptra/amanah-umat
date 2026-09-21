# Website LKSA Amanah Ummat Balikpapan

Website profil dan donasi untuk LKSA Amanah Ummat, lengkap dengan panel admin
(CMS) agar pengurus dapat memperbarui isi website sendiri tanpa menyentuh kode.

- **Frontend:** Vue 3 + Vite + Tailwind CSS
- **Database, autentikasi, penyimpanan foto:** Supabase

---

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env    # lalu isi kedua nilainya
npm run dev
```

Website terbuka di `http://localhost:5173`, panel admin di
`http://localhost:5173/admin`.

### Isi file `.env`

Ambil dari Supabase Dashboard → **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

File `.env` tidak ikut masuk ke Git. Jangan pernah memasukkan *service role key*
ke dalam proyek ini — kunci tersebut memberi akses penuh ke database dan akan
ikut terkirim ke browser setiap pengunjung.

### Pemasangan database (sekali saja)

Sebagian besar tabel sudah ada di Supabase. Lima berkas SQL perlu dijalankan
untuk mengaktifkan fitur tambahan. Buka Supabase Dashboard -> **SQL Editor**
-> **New query**, tempel isinya, lalu tekan **Run**:

| Berkas | Mengaktifkan |
| --- | --- |
| [`supabase/site_settings.sql`](supabase/site_settings.sql) | Menu *Logo & Nama* — mengganti logo dan nama yayasan |
| [`supabase/about_sections.sql`](supabase/about_sections.sql) | Menu *Perjalanan & Nilai* — kartu nilai dan garis waktu di halaman Tentang Kami |
| [`supabase/achievements.sql`](supabase/achievements.sql) | Menu *Prestasi* — halaman Prestasi beserta pengelolaannya |
| [`supabase/social_media.sql`](supabase/social_media.sql) | Isian Instagram & YouTube pada menu *Kontak* |
| [`supabase/gallery_categories.sql`](supabase/gallery_categories.sql) | Tombol *Kelola Kategori* pada menu *Galeri Foto* |

Kelima berkas aman dijalankan berulang kali.

Sebelum dijalankan, website tetap berfungsi normal: navbar memakai nama
"Amanah Ummat" dengan logo huruf bawaan, halaman Tentang Kami tampil tanpa
bagian nilai dan perjalanan, halaman Prestasi tampil dengan keterangan "belum
tersedia", isian media sosial belum muncul, kategori galeri memakai empat
kategori bawaan, dan menu terkait di panel admin menampilkan petunjuk ini.

Setelah dijalankan, pastikan pengunjung biasa tidak bisa mengubahnya:

```bash
# Harus mengembalikan data (boleh dibaca siapa saja)
curl "$URL/rest/v1/site_settings?select=*" -H "apikey: $KEY"

# Harus DITOLAK (hanya admin yang sudah login boleh mengubah)
curl -X PATCH "$URL/rest/v1/site_settings?id=eq.1"   -H "apikey: $KEY" -H "Content-Type: application/json"   -d '{"site_name":"uji"}'
```

---

## Deploy

Perintah build: `npm run build` · Folder hasil: `dist`

**Wajib:** isi kedua *environment variable* di atas pada pengaturan layanan
hosting. Tanpa itu, website hanya menampilkan pesan kesalahan konfigurasi.

Proyek ini memakai *client-side routing*, sehingga server harus mengarahkan
semua alamat ke `index.html`. Aturan tersebut sudah disiapkan:

| Layanan | Berkas yang dipakai |
| --- | --- |
| Vercel | `vercel.json` |
| Netlify | `netlify.toml` dan `public/_redirects` |
| Cloudflare Pages | `public/_redirects` |

Untuk hosting lain (Nginx, Apache, cPanel), arahkan semua permintaan yang tidak
cocok dengan berkas apa pun ke `index.html`. Tanpa aturan ini, membuka atau
me-refresh `/donasi` secara langsung akan menghasilkan halaman 404.

---

## Struktur proyek

```
src/
  components/    Navbar, Footer, header & notifikasi panel admin
  layouts/       Kerangka halaman publik
  lib/
    supabase.js      Koneksi Supabase
    utils.js         Normalisasi nomor WhatsApp, validasi foto
    siteIdentity.js  Logo & nama yayasan, diambil sekali lalu dibagikan
    favicon.js       Ikon tab browser, mengikuti logo dari CMS
    motion.js        Directive v-reveal + penanda "kurangi gerakan"
    mapLocation.js   Membaca koordinat dari tautan Google Maps
    aboutIcons.js    Pilihan ikon untuk kartu Nilai Kami
    adminMenu.js     Daftar menu panel admin
supabase/
  site_settings.sql    Tabel logo & nama
  about_sections.sql   Tabel nilai & perjalanan
  achievements.sql     Tabel prestasi
  social_media.sql     Kolom Instagram & YouTube pada tabel kontak
  gallery_categories.sql  Tabel kategori galeri
  router/        Daftar alamat halaman + penjaga login admin
  views/         Halaman publik dan halaman admin
```

---

## Panduan singkat untuk pengurus (panel admin)

Buka `/admin`, masuk dengan email dan password yang sudah didaftarkan di
Supabase -> **Authentication -> Users**.

Setelah masuk, menu ada di sisi kiri layar (atau lewat tombol garis tiga di
pojok kanan atas bila memakai ponsel). Menu tidak akan hilang saat berpindah
bagian, jadi tidak perlu kembali ke beranda panel setiap kali.

| Menu | Yang diubah | Muncul di |
| --- | --- | --- |
| Logo & Nama | Logo dan nama yayasan | Bagian atas & bawah semua halaman |
| Perjalanan & Nilai | Kartu nilai + garis waktu yayasan | Halaman Tentang Kami |
| Halaman Depan | Judul besar, kalimat pengantar, foto latar, ajakan donasi | Halaman pertama website |
| Tentang Kami | Judul, cerita yayasan, foto utama | Halaman Tentang Kami |
| Program | Tambah / ubah / hapus program | Halaman Program |
| Galeri Foto | Tambah / ubah / hapus foto, dan kelola daftar kategorinya | Halaman Galeri |
| Prestasi | Tambah / ubah / hapus / urutkan prestasi | Halaman Prestasi |
| Kontak | Alamat, telepon, WhatsApp, email, Instagram, YouTube, titik lokasi peta | Halaman Kontak + bagian bawah semua halaman |
| Donasi | Rekening, QRIS, WhatsApp konfirmasi | Halaman Donasi |

### Cara kerja panel

- **Tanda bintang merah (\*)** berarti isian itu wajib diisi.
- Di bawah setiap isian ada **penjelasan singkat** tentang isian tersebut
  muncul di bagian mana pada website.
- **Bar hijau di bawah layar** menunjukkan keadaan saat ini: "Ada perubahan
  yang belum disimpan" atau "Semua perubahan sudah tersimpan". Tombol Simpan
  selalu berada di situ, tidak perlu digulir mencarinya.
- Jika berpindah menu saat masih ada perubahan yang belum disimpan, akan
  muncul peringatan lebih dulu.
- Tombol **Lihat di website** di pojok kanan atas membuka halaman aslinya di
  tab baru, untuk memastikan hasilnya sudah sesuai.
- **Penghitung karakter** di sudut kanan isian membantu menjaga tulisan tidak
  terlalu panjang sehingga tampilan website tetap rapi. Melewati angka itu
  masih boleh disimpan, hanya berupa saran.

### Foto

Foto bisa dipilih dengan mengeklik kotak bertanda panah, atau langsung
menyeret berkas foto ke kotak tersebut. Pratinjau besar akan langsung muncul,
dengan label **"Foto baru - belum disimpan"** sampai tombol Simpan ditekan.

Format JPG, PNG, atau WebP, maksimal 5 MB per foto. Foto yang terlalu besar
akan ditolak beserta keterangannya.

**Khusus logo:** gunakan gambar berbentuk persegi. Format PNG dengan latar
transparan memberi hasil terbaik karena logo tampil di atas latar putih
(navbar) maupun gelap (bagian bawah halaman). Halaman *Logo & Nama*
menyediakan pratinjau kedua latar tersebut. Bila logo dikosongkan, website
menampilkan kotak hijau berisi huruf awal nama yayasan.

Logo yang sama juga dipakai sebagai **ikon tab browser** (favicon), jadi pilih
gambar yang tetap terbaca saat diperkecil ke ukuran sangat kecil. Halaman
*Logo & Nama* menampilkan pratinjaunya juga.

### Nomor WhatsApp

Boleh ditulis seperti biasa, misalnya `08123456789`. Sistem otomatis
mengubahnya menjadi format internasional. Di bawah kolom isian akan muncul
tautan hasil konversinya (`wa.me/628...`) - pastikan tautan itu benar sebelum
menyimpan. Bila muncul tulisan merah, berarti nomornya belum benar.

### Titik lokasi di peta

Pada menu *Kontak* ada bagian **Lokasi di peta**. Cara mengisinya:

1. Buka Google Maps, cari lokasi yayasan
2. Salin tautan dari kolom alamat browser
3. Tempel di kolom yang tersedia, tekan **Baca Lokasi**
4. Periksa pratinjau petanya, lalu tekan **Simpan Kontak**

Koordinat terisi otomatis — tidak perlu mengetik angka apa pun.

**Bila tautannya masih berbentuk pendek** (`maps.app.goo.gl/...`), tautan itu
tidak dapat dibaca langsung karena aturan keamanan browser. Buka dulu tautan
tersebut sampai petanya muncul, lalu salin alamat lengkap dari kolom alamat
browser.

Bila muncul peringatan kuning *"Titik ini berada di luar Indonesia"*, biasanya
lintang dan bujur tertukar posisinya. Periksa pratinjau petanya sebelum
menyimpan.

Titik lokasi boleh dikosongkan — halaman Kontak akan menampilkan peta lokasi
bawaan.

### Kategori galeri

Daftar kategori pada halaman *Galeri Foto* diatur lewat tombol **Kelola
Kategori** di pojok kanan atas. Dari situ kategori bisa ditambah, diganti
namanya, dihapus, dan diurutkan — urutannya menentukan urutan tombol penyaring
yang dilihat pengunjung.

Mengganti nama kategori **ikut memperbarui seluruh foto** yang memakainya, jadi
tidak ada foto yang tertinggal di kategori lama. Menghapus kategori **tidak**
menghapus fotonya: foto tersebut hanya berpindah menjadi tanpa kategori.

Kategori yang belum dipakai foto mana pun tidak ditampilkan di website, supaya
pengunjung tidak menemukan tombol penyaring yang kosong.

Foto yang belum diberi kategori berkumpul di kelompok bawaan **Tanpa
Kategori** — muncul sebagai tombol penyaring terakhir di panel admin, dan
sebagai **Lainnya** di halaman galeri. Kelompok ini terbentuk sendiri, jadi
tidak bisa diubah namanya maupun dihapus, dan menghilang dengan sendirinya
begitu semua foto sudah dikelompokkan.

### Menghapus

Menghapus program, foto, atau prestasi selalu menampilkan kotak konfirmasi
lebih dulu. Data yang sudah dihapus **tidak dapat dikembalikan**.

## Catatan tentang animasi

Seluruh animasi hanya memakai `transform` dan `opacity`, yang dikerjakan kartu
grafis. Menganimasikan properti lain (`width`, `top`, `margin`) memaksa browser
menghitung ulang tata letak pada setiap bingkai dan membuat gerakan tersendat
di ponsel kelas menengah.

Animasi dimatikan seluruhnya bila perangkat pengunjung menyalakan pengaturan
*kurangi gerakan* (reduce motion) — sebagian orang menyalakannya karena
gerakan membuat mereka pusing atau mual. Penjaganya ada di dua tempat:
aturan `@media (prefers-reduced-motion: reduce)` pada
[`src/style.css`](src/style.css), dan pemeriksaan di dalam
[`src/lib/motion.js`](src/lib/motion.js).

Halaman Donasi sengaja tidak menganimasikan bagian nomor rekening: informasi
itu harus tampil diam dan jelas.

---

## Catatan tentang ikon dan pratinjau tautan

Ikon tab browser diganti oleh JavaScript setelah halaman dimuat, mengikuti
logo yang diunggah admin. Berkas [`public/favicon.svg`](public/favicon.svg)
tetap diperlukan sebagai tampilan awal sebelum JavaScript berjalan.

Yang **tidak** ikut berubah otomatis adalah gambar pratinjau saat tautan
dibagikan ke WhatsApp atau media sosial (`og:image`). Tag tersebut dibaca
langsung dari berkas HTML oleh robot media sosial yang tidak menjalankan
JavaScript. Bila nanti diperlukan, gambar pratinjau harus dipasang sebagai
berkas statis di folder `public/` dan dirujuk dari `index.html`.

---

## Keamanan

Panel admin dilindungi Supabase Auth, dan data dilindungi *Row Level Security*
(RLS) di sisi Supabase — bukan hanya disembunyikan di tampilan. Pengunjung biasa
hanya dapat membaca data; menambah, mengubah, menghapus, dan mengunggah foto
hanya bisa dilakukan setelah login sebagai admin.

Jangan melonggarkan kebijakan RLS di Supabase tanpa alasan yang jelas: itu satu-
satunya hal yang mencegah orang luar mengganti nomor rekening donasi.
