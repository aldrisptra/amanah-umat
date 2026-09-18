import {
  BookOpen,
  GraduationCap,
  HandHeart,
  Handshake,
  Heart,
  House,
  Moon,
  ShieldCheck,
  Smile,
  Sprout,
  Star,
  Stethoscope,
  Users,
  Utensils,
} from "lucide-vue-next";

/**
 * Pilihan ikon untuk kartu "Nilai Kami".
 *
 * Pengurus tidak perlu tahu nama teknis ikon. Yang tersimpan di database
 * hanyalah kunci pendek (mis. "heart"), dan di panel admin ikon dipilih
 * secara visual dengan keterangan berbahasa Indonesia.
 *
 * Daftarnya sengaja terbatas: terlalu banyak pilihan justru membuat
 * pengurus bingung, dan tampilan website jadi tidak seragam.
 */
export const IKON_NILAI = {
  heart: { label: "Hati", komponen: Heart },
  handHeart: { label: "Tangan & Hati", komponen: HandHeart },
  handshake: { label: "Jabat Tangan", komponen: Handshake },
  book: { label: "Buku", komponen: BookOpen },
  graduation: { label: "Topi Wisuda", komponen: GraduationCap },
  house: { label: "Rumah", komponen: House },
  users: { label: "Kebersamaan", komponen: Users },
  shield: { label: "Perisai (Amanah)", komponen: ShieldCheck },
  sprout: { label: "Tunas (Tumbuh)", komponen: Sprout },
  star: { label: "Bintang", komponen: Star },
  smile: { label: "Senyum", komponen: Smile },
  moon: { label: "Bulan Sabit", komponen: Moon },
  utensils: { label: "Makanan", komponen: Utensils },
  health: { label: "Kesehatan", komponen: Stethoscope },
};

export const DAFTAR_IKON_NILAI = Object.entries(IKON_NILAI).map(
  ([kunci, data]) => ({ kunci, ...data }),
);

/**
 * Ambil komponen ikon dari kunci yang tersimpan. Bila kuncinya tidak dikenal
 * (misalnya diubah langsung di database), kembalikan ikon hati agar kartu
 * tetap tampil utuh alih-alih kosong.
 */
export const ambilIkonNilai = (kunci) =>
  IKON_NILAI[kunci]?.komponen || IKON_NILAI.heart.komponen;
