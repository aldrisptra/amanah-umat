import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";

import { supabase } from "../lib/supabase";
import { terapkanMetaHalaman } from "../lib/seo";

const routes = [
  // =========================
  // PUBLIC
  // =========================

  {
    path: "/",
    name: "home",
    component: Home,
    meta: {
      title: "Panti Asuhan Yatim & Dhuafa",
      description:
        "LKSA Amanah Ummat Balikpapan membina sekitar 30 anak yatim, piatu, dan dhuafa melalui pendidikan, pembinaan keagamaan, dan kegiatan sosial setiap hari.",
    },
  },

  {
    path: "/tentang-kami",
    name: "about",
    component: () => import("../views/About.vue"),
    meta: {
      title: "Tentang Kami",
      description:
        "Mengenal LKSA Amanah Ummat Balikpapan: anak asuh yang dibina, para pengurus, nilai yang dipegang, dan perjalanan yayasan dari masa ke masa.",
    },
  },

  {
    path: "/program",
    name: "programs",
    component: () => import("../views/Programs.vue"),
    meta: {
      title: "Program Pembinaan Anak",
      description:
        "Program harian dan mingguan LKSA Amanah Ummat Balikpapan: sholat berjamaah, TPQ, kelas tahfiz, Madrasah Diniyah, les pelajaran, hingga kegiatan sosial.",
    },
  },

  {
    path: "/galeri",
    name: "gallery",
    component: () => import("../views/Gallery.vue"),
    meta: {
      title: "Galeri Kegiatan",
      description:
        "Dokumentasi kegiatan dan keseharian anak-anak LKSA Amanah Ummat Balikpapan, mulai dari belajar mengaji sampai kegiatan sosial bersama masyarakat.",
    },
  },

  {
    path: "/prestasi",
    name: "achievements",
    component: () => import("../views/Achievements.vue"),
    meta: {
      title: "Prestasi & Penghargaan",
      description:
        "Penghargaan dan capaian yang diraih anak asuh maupun lembaga LKSA Amanah Ummat Balikpapan, dari bidang tahfidz, akademik, hingga kelembagaan.",
    },
  },

  {
    path: "/kontak",
    name: "contact",
    component: () => import("../views/Contact.vue"),
    meta: {
      title: "Kontak & Lokasi",
      description:
        "Alamat, nomor telepon, WhatsApp, dan email LKSA Amanah Ummat Balikpapan. Lengkap dengan titik lokasi di peta bagi tamu dan calon donatur.",
    },
  },

  {
    path: "/donasi",
    name: "donation",
    component: () => import("../views/Donation.vue"),
    meta: {
      title: "Donasi",
      description:
        "Salurkan donasi untuk anak-anak LKSA Amanah Ummat Balikpapan melalui transfer bank atau QRIS. Nomor rekening resmi dan kontak konfirmasi tersedia di sini.",
    },
  },

  // =========================
  // ADMIN
  // =========================

  {
    path: "/admin/login",
    name: "AdminLogin",
    component: () => import("../views/AdminLogin.vue"),
  },

  // Halaman membuat password baru, dibuka dari tautan yang dikirim ke email
  // pengurus. Sengaja TIDAK memerlukan login: yang membukanya justru sedang
  // tidak bisa masuk. Pengamannya ada pada tautan email itu sendiri, yang
  // hanya berlaku satu jam dan sekali pakai.
  {
    path: "/admin/atur-ulang-password",
    name: "AdminResetPassword",
    component: () => import("../views/AdminResetPassword.vue"),
  },

  // Seluruh halaman pengelolaan berbagi satu kerangka (menu samping, identitas
  // admin, tombol keluar). Dengan rute bersarang, kerangka itu tidak dibuat
  // ulang setiap berpindah menu - menu samping tetap diam dan posisi
  // gulirannya tidak melompat.
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: () => import("../views/AdminDashboard.vue"),
      },
      {
        path: "identitas",
        name: "AdminIdentity",
        component: () => import("../views/AdminIdentity.vue"),
      },
      {
        path: "home",
        name: "AdminHome",
        component: () => import("../views/AdminHome.vue"),
      },
      {
        path: "about",
        name: "AdminAbout",
        component: () => import("../views/AdminAbout.vue"),
      },
      {
        path: "perjalanan",
        name: "AdminAboutSections",
        component: () => import("../views/AdminAboutSections.vue"),
      },
      {
        path: "program",
        name: "AdminPrograms",
        component: () => import("../views/AdminPrograms.vue"),
      },
      {
        path: "gallery",
        name: "AdminGallery",
        component: () => import("../views/AdminGallery.vue"),
      },
      {
        path: "prestasi",
        name: "AdminAchievements",
        component: () => import("../views/AdminAchievements.vue"),
      },
      {
        path: "contact",
        name: "AdminContact",
        component: () => import("../views/AdminContact.vue"),
      },
      {
        path: "donation",
        name: "AdminDonation",
        component: () => import("../views/AdminDonation.vue"),
      },
    ],
  },

  // =========================
  // 404 - HARUS PALING BAWAH
  // =========================

  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFound.vue"),
    meta: {
      title: "Halaman Tidak Ditemukan",
      // Halaman kesalahan tidak perlu masuk hasil pencarian
      noindex: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,

  // Tanpa ini, pindah halaman akan mempertahankan posisi scroll lama
  // sehingga pengunjung seolah-olah mendarat di tengah halaman.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;

    return { top: 0 };
  },
});

// =========================
// ADMIN AUTH GUARD
// =========================

// Alamat di dalam /admin yang boleh dibuka tanpa login.
const ADMIN_TANPA_LOGIN = ["/admin/login", "/admin/atur-ulang-password"];

router.beforeEach(async (to) => {
  const isAdminRoute = to.path.startsWith("/admin");

  // Halaman publik tidak perlu menunggu Supabase memulihkan sesi.
  // Sebelumnya getSession() dipanggil pada SETIAP navigasi, termasuk
  // beranda, sehingga render awal website tertunda tanpa alasan.
  if (!isAdminRoute) return true;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const bolehTanpaLogin = ADMIN_TANPA_LOGIN.includes(to.path);

  // Belum login -> arahkan ke login, sambil mengingat tujuan awal
  if (!session && !bolehTanpaLogin) {
    return { path: "/admin/login", query: { redirect: to.fullPath } };
  }

  // Sudah login tapi membuka halaman login -> arahkan ke dashboard.
  // Halaman atur ulang password dikecualikan: sesi pemulihan dari tautan
  // email memang berupa sesi yang sah, jadi tanpa pengecualian ini pengurus
  // akan terlempar ke dashboard sebelum sempat mengganti passwordnya.
  if (session && to.path === "/admin/login") {
    return "/admin";
  }

  return true;
});

// Judul dan keterangan halaman dipasang SETELAH perpindahan selesai, supaya
// alamat di bilah browser dan judul halaman tidak pernah berbeda - termasuk
// ketika navigasi dibatalkan penjaga login di atas.
router.afterEach((to) => {
  const adminRoute = to.path.startsWith("/admin");

  terapkanMetaHalaman({
    title: adminRoute ? "Panel Pengelola" : to.meta.title,
    description: adminRoute ? "" : to.meta.description,
    path: to.path,
    // Seluruh halaman panel dilarang masuk hasil pencarian. robots.txt sudah
    // melarangnya, tag ini lapisan kedua untuk perayap yang mengabaikannya.
    noindex: adminRoute || Boolean(to.meta.noindex),
  });
});

export default router;
