import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import About from "../views/About.vue";
import Programs from "../views/Programs.vue";
import Gallery from "../views/Gallery.vue";
import Contact from "../views/Contact.vue";
import Donation from "../views/Donation.vue";

import AdminLogin from "../views/AdminLogin.vue";
import AdminDashboard from "../views/AdminDashboard.vue";

import { supabase } from "../lib/supabase";

const routes = [
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

  // Halaman membutuhkan login
  if (to.meta.requiresAuth && !session) {
    return "/admin/login";
  }

  // Kalau sudah login tapi membuka halaman login
  if (to.path === "/admin/login" && session) {
    return "/admin";
  }

  return true;
});

export default router;
