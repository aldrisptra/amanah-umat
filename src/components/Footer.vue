<template>
  <footer class="mt-20 bg-gray-950 text-white">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 lg:px-8"
    >
      <!-- Brand -->
      <div>
        <div class="mb-5 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold"
          >
            Y
          </div>

          <span class="text-xl font-bold"> Yayasan </span>
        </div>

        <p class="max-w-sm text-sm leading-7 text-gray-400">
          Bersama menebar kebaikan dan memberikan manfaat bagi masyarakat.
        </p>
      </div>

      <!-- Menu -->
      <div>
        <h3 class="mb-5 text-sm font-semibold uppercase tracking-wider">
          Menu
        </h3>

        <div class="flex flex-col gap-3 text-sm">
          <router-link to="/" class="text-gray-400 transition hover:text-white">
            Beranda
          </router-link>

          <router-link
            to="/tentang-kami"
            class="text-gray-400 transition hover:text-white"
          >
            Tentang Kami
          </router-link>

          <router-link
            to="/program"
            class="text-gray-400 transition hover:text-white"
          >
            Program
          </router-link>

          <router-link
            to="/galeri"
            class="text-gray-400 transition hover:text-white"
          >
            Galeri
          </router-link>

          <router-link
            to="/kontak"
            class="text-gray-400 transition hover:text-white"
          >
            Kontak
          </router-link>
        </div>
      </div>

      <!-- Contact -->
      <div>
        <h3 class="mb-5 text-sm font-semibold uppercase tracking-wider">
          Kontak
        </h3>

        <div class="space-y-3 text-sm text-gray-400">
          <p>Balikpapan, Kalimantan Timur</p>

          <p>+62 812-xxxx-xxxx</p>

          <p>email@yayasan.org</p>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-gray-800">
      <div class="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <p class="text-center text-sm text-gray-500">
          © 2026 Yayasan. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
