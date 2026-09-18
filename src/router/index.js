import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";

import { supabase } from "../lib/supabase";

const routes = [
  // =========================
  // PUBLIC
  // =========================

  {
    path: "/",
    name: "home",
    component: Home,
  },

  {
    path: "/tentang-kami",
    name: "about",
    component: () => import("../views/About.vue"),
  },

  {
    path: "/program",
    name: "programs",
    component: () => import("../views/Programs.vue"),
  },

  {
    path: "/galeri",
    name: "gallery",
    component: () => import("../views/Gallery.vue"),
  },

  {
    path: "/kontak",
    name: "contact",
    component: () => import("../views/Contact.vue"),
  },

  {
    path: "/donasi",
    name: "donation",
    component: () => import("../views/Donation.vue"),
  },

  // =========================
  // ADMIN
  // =========================

  {
    path: "/admin/login",
    name: "AdminLogin",
    component: () => import("../views/AdminLogin.vue"),
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

router.beforeEach(async (to) => {
  const isAdminRoute = to.path.startsWith("/admin");

  // Halaman publik tidak perlu menunggu Supabase memulihkan sesi.
  // Sebelumnya getSession() dipanggil pada SETIAP navigasi, termasuk
  // beranda, sehingga render awal website tertunda tanpa alasan.
  if (!isAdminRoute) return true;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdminLoginRoute = to.path === "/admin/login";

  // Belum login -> arahkan ke login, sambil mengingat tujuan awal
  if (!session && !isAdminLoginRoute) {
    return { path: "/admin/login", query: { redirect: to.fullPath } };
  }

  // Sudah login tapi membuka halaman login -> arahkan ke dashboard
  if (session && isAdminLoginRoute) {
    return "/admin";
  }

  return true;
});

export default router;
