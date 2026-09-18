<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { ADMIN_MENU } from "../lib/adminMenu";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import SiteLogo from "../components/SiteLogo.vue";

const route = useRoute();
const router = useRouter();

const adminEmail = ref("");
const menuTerbuka = ref(false);
const konfirmasiKeluar = ref(false);

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  adminEmail.value = user?.email || "";
});

// Menu samping versi ponsel harus tertutup sendiri setelah berpindah halaman
watch(
  () => route.path,
  () => {
    menuTerbuka.value = false;
  },
);

const logout = async () => {
  await supabase.auth.signOut();

  router.replace("/admin/login");
};
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- =========================================================
         MENU SAMPING (layar besar)
    ========================================================== -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex"
    >
      <!-- Identitas -->
      <div class="border-b border-gray-100 px-5 py-5">
        <SiteLogo size="sm" name-class="text-gray-900" />

        <p class="mt-1.5 text-xs text-gray-500">Panel Pengelola</p>
      </div>

      <!-- Navigasi -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <router-link
          to="/admin"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
          :class="
            route.path === '/admin'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          "
        >
          <LayoutDashboard class="h-5 w-5 shrink-0" />
          Beranda Panel
        </router-link>

        <p
          class="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          Isi Website
        </p>

        <div class="mt-2 space-y-1">
          <router-link
            v-for="item in ADMIN_MENU"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="
              route.path === item.to
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            "
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            {{ item.label }}
          </router-link>
        </div>
      </nav>

      <!-- Akun -->
      <div class="border-t border-gray-100 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <ExternalLink class="h-5 w-5 shrink-0" />
          Lihat Website
        </a>

        <div class="mt-2 rounded-xl bg-gray-50 px-3 py-3">
          <p class="text-xs text-gray-500">Masuk sebagai</p>

          <p class="mt-0.5 truncate text-sm font-semibold text-gray-800">
            {{ adminEmail || "Admin" }}
          </p>

          <button
            type="button"
            @click="konfirmasiKeluar = true"
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut class="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </aside>

    <!-- =========================================================
         MENU PONSEL
    ========================================================== -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden"
    >
      <div class="min-w-0">
        <SiteLogo size="sm" name-class="text-gray-900" />
      </div>

      <button
        type="button"
        @click="menuTerbuka = true"
        aria-label="Buka menu"
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50"
      >
        <Menu class="h-5 w-5" />
      </button>
    </header>

    <!-- Laci menu ponsel -->
    <div
      v-if="menuTerbuka"
      class="fixed inset-0 z-50 bg-black/40 lg:hidden"
      @click.self="menuTerbuka = false"
    >
      <div
        class="ml-auto flex h-full w-72 max-w-[85%] flex-col bg-white shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-4 py-4"
        >
          <p class="text-sm font-bold text-gray-900">Menu Pengelola</p>

          <button
            type="button"
            @click="menuTerbuka = false"
            aria-label="Tutup menu"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <router-link
            to="/admin"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
            :class="
              route.path === '/admin'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50'
            "
          >
            <LayoutDashboard class="h-5 w-5 shrink-0" />
            Beranda Panel
          </router-link>

          <p
            class="mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Isi Website
          </p>

          <div class="mt-2 space-y-1">
            <router-link
              v-for="item in ADMIN_MENU"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
              :class="
                route.path === item.to
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              "
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              {{ item.label }}
            </router-link>
          </div>
        </nav>

        <div class="border-t border-gray-100 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <ExternalLink class="h-5 w-5 shrink-0" />
            Lihat Website
          </a>

          <p class="mt-2 px-3 text-xs text-gray-500">
            Masuk sebagai
            <span class="font-semibold text-gray-700">
              {{ adminEmail || "Admin" }}
            </span>
          </p>

          <button
            type="button"
            @click="konfirmasiKeluar = true"
            class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut class="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>

    <!-- =========================================================
         ISI HALAMAN
    ========================================================== -->
    <div class="lg:pl-64">
      <router-view />
    </div>

    <AdminConfirm
      :open="konfirmasiKeluar"
      title="Keluar dari panel?"
      message="Anda perlu memasukkan email dan password lagi untuk masuk kembali."
      confirm-label="Ya, keluar"
      @confirm="logout"
      @cancel="konfirmasiKeluar = false"
    />
  </div>
</template>
