import {
  BookOpen,
  HandCoins,
  Home,
  Images,
  LayoutGrid,
  Milestone,
  Phone,
  Sparkles,
  Trophy,
} from "lucide-vue-next";

/**
 * Satu sumber kebenaran untuk menu panel admin.
 *
 * Dipakai bersama oleh menu samping dan kartu di dashboard, supaya keduanya
 * tidak pernah berbeda isi. Setiap menu menyebutkan halaman publik yang
 * dipengaruhinya (`publicPath`), sehingga pengurus bisa langsung memeriksa
 * hasil perubahannya.
 */
export const ADMIN_MENU = [
  {
    to: "/admin/identitas",
    label: "Logo & Nama",
    icon: Sparkles,
    color: "teal",
    publicPath: "/",
    description:
      "Logo dan nama yayasan yang tampil di bagian atas dan bawah setiap halaman.",
    summary: { table: "site_settings", kind: "single" },
  },
  {
    to: "/admin/home",
    label: "Halaman Depan",
    icon: Home,
    color: "emerald",
    publicPath: "/",
    description:
      "Tulisan besar, foto latar, dan kotak ajakan donasi di halaman pertama website.",
    // Dipakai dashboard untuk menampilkan ringkasan isi
    summary: { table: "home_content", kind: "single" },
  },
  {
    to: "/admin/about",
    label: "Tentang Kami",
    icon: BookOpen,
    color: "orange",
    publicPath: "/tentang-kami",
    description: "Cerita, sejarah, dan foto utama tentang LKSA Amanah Ummat.",
    summary: { table: "about", kind: "single" },
  },
  {
    to: "/admin/perjalanan",
    label: "Perjalanan & Nilai",
    icon: Milestone,
    color: "lime",
    publicPath: "/tentang-kami",
    description:
      "Kartu nilai yayasan dan garis waktu perjalanan pada halaman Tentang Kami.",
    summary: { table: "about_milestones", kind: "list", unit: "tahapan" },
  },
  {
    to: "/admin/program",
    label: "Program",
    icon: LayoutGrid,
    color: "sky",
    publicPath: "/program",
    description:
      "Daftar kegiatan dan program yang dijalankan bersama anak-anak.",
    summary: { table: "programs", kind: "list", unit: "program" },
  },
  {
    to: "/admin/gallery",
    label: "Galeri Foto",
    icon: Images,
    color: "violet",
    publicPath: "/galeri",
    description: "Kumpulan foto kegiatan dan keseharian anak-anak.",
    summary: { table: "gallery", kind: "list", unit: "foto" },
  },
  {
    to: "/admin/prestasi",
    label: "Prestasi",
    icon: Trophy,
    color: "yellow",
    publicPath: "/prestasi",
    description:
      "Penghargaan dan capaian anak asuh maupun lembaga yang tampil di halaman Prestasi.",
    summary: { table: "achievements", kind: "list", unit: "prestasi" },
  },
  {
    to: "/admin/contact",
    label: "Kontak",
    icon: Phone,
    color: "amber",
    publicPath: "/kontak",
    description: "Alamat, nomor telepon, WhatsApp, dan email yayasan.",
    summary: { table: "contact", kind: "single" },
  },
  {
    to: "/admin/donation",
    label: "Donasi",
    icon: HandCoins,
    color: "rose",
    publicPath: "/donasi",
    description: "Nomor rekening, QRIS, dan kontak konfirmasi donasi.",
    summary: { table: "donation_info", kind: "single" },
  },
];

/**
 * Kelas warna ditulis lengkap (bukan dirangkai `bg-${warna}-100`) karena
 * Tailwind memindai kode sebagai teks: nama kelas yang dirangkai saat program
 * berjalan tidak akan ikut dibuatkan gayanya.
 */
export const MENU_COLORS = {
  teal: "bg-teal-100 text-teal-700",
  lime: "bg-lime-100 text-lime-700",
  emerald: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  yellow: "bg-yellow-100 text-yellow-700",
  rose: "bg-rose-100 text-rose-700",
};
