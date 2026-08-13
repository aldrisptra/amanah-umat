import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import About from "../views/About.vue";
import Programs from "../views/Programs.vue";
import Gallery from "../views/Gallery.vue";
import Contact from "../views/Contact.vue";
import Donation from "../views/Donation.vue";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
