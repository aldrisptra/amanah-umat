import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import About from "../views/About.vue";
import Programs from "../views/Programs.vue";
import Gallery from "../views/Gallery.vue";
import Contact from "../views/Contact.vue";
import Donation from "../views/Donation.vue";

import AdminLogin from "../views/AdminLogin.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import AdminPrograms from "../views/AdminPrograms.vue";
import AdminContact from "../views/AdminContact.vue";
import AdminDonation from "../views/AdminDonation.vue";
import AdminAbout from "../views/AdminAbout.vue";
import AdminHome from "../views/AdminHome.vue";

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
    component: About,
  },

  {
    path: "/program",
    name: "programs",
    component: Programs,
  },

  {
    path: "/galeri",
    name: "gallery",
    component: Gallery,
  },

  {
    path: "/kontak",
    name: "contact",
    component: Contact,
  },

  {
    path: "/donasi",
    name: "donation",
    component: Donation,
  },

  // =========================
  // ADMIN
  // =========================

  {
    path: "/admin/login",
    name: "AdminLogin",
    component: AdminLogin,
  },

  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/home",
    name: "AdminHome",
    component: AdminHome,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/program",
    name: "AdminPrograms",
    component: AdminPrograms,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/gallery",
    name: "AdminGallery",
    component: () => import("../views/AdminGallery.vue"),
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/contact",
    name: "AdminContact",
    component: AdminContact,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/donation",
    name: "AdminDonation",
    component: AdminDonation,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/admin/about",
    name: "AdminAbout",
    component: AdminAbout,
    meta: {
      requiresAuth: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// =========================
// ADMIN AUTH GUARD
// =========================

router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdminRoute = to.path.startsWith("/admin");
  const isAdminLoginRoute = to.path === "/admin/login";

  if (isAdminRoute) {
    // Belum login → arahkan ke login
    if (!session && !isAdminLoginRoute) {
      return "/admin/login";
    }

    // Sudah login tapi membuka halaman login → arahkan ke dashboard
    if (session && isAdminLoginRoute) {
      return "/admin";
    }
  }

  return true;
});

export default router;
