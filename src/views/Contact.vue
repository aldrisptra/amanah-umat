```vue
<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Kontak
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Mari terhubung dengan Amanah Umat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Jika Anda ingin berkunjung, memberikan dukungan, atau mendapatkan
            informasi lebih lanjut, silakan hubungi kami melalui kontak yang
            tersedia.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         CONTACT INFORMATION
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <!-- LEFT -->
        <div>
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Hubungi Kami
          </span>

          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Kami siap menerima pertanyaan Anda.
          </h2>

          <p class="mt-5 max-w-xl leading-8 text-gray-600">
            Silakan gunakan informasi di bawah ini untuk menghubungi Panti
            Asuhan Amanah Umat.
          </p>

          <!-- Contact Items -->
          <div class="mt-10 space-y-7">
            <!-- Address -->
            <div class="flex gap-5">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600"
              >
                📍
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Alamat</h3>

                <p class="mt-1 leading-7 text-gray-600">
                  Alamat Panti Asuhan Amanah Umat, Balikpapan, Kalimantan Timur.
                </p>
              </div>
            </div>

            <!-- WhatsApp -->
            <div class="flex gap-5">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600"
              >
                ☎
              </div>

              <div>
                <h3 class="font-bold text-gray-900">WhatsApp</h3>

                <a
                  href="#"
                  class="mt-1 inline-block text-gray-600 transition hover:text-emerald-600"
                >
                  08xx-xxxx-xxxx
                </a>
              </div>
            </div>

            <!-- Email -->
            <div class="flex gap-5">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600"
              >
                ✉
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Email</h3>

                <a
                  href="mailto:info@amanahumat.or.id"
                  class="mt-1 inline-block text-gray-600 transition hover:text-emerald-600"
                >
                  info@amanahumat.or.id
                </a>
              </div>
            </div>

            <!-- Visiting Hours -->
            <div class="flex gap-5">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600"
              >
                🕐
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Jam Kunjungan</h3>

                <p class="mt-1 leading-7 text-gray-600">
                  Senin – Minggu<br />
                  08.00 – 17.00 WITA
                </p>
              </div>
            </div>
          </div>

          <!-- WhatsApp Button -->
          <a
            href="#"
            class="mt-10 inline-flex items-center rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Hubungi via WhatsApp
            <span class="ml-2">→</span>
          </a>
        </div>

        <!-- RIGHT -->
        <div>
          <div
            class="h-full min-h-[450px] overflow-hidden rounded-3xl bg-gray-100"
          >
            <!-- Google Maps nanti -->
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.891457151503!2d116.81583477472432!3d-1.2350293987531882!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2df1473fd39e937d%3A0xa0d99127e037ab21!2sPanti%20asuhan%20Amanah%20Ummat!5e0!3m2!1sid!2sid!4v1786627137003!5m2!1sid!2sid"
              width="600"
              height="450"
              style="border: 0"
              allowfullscreen
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         DONATION CTA
    ========================== -->
    <section class="px-5 pb-20 lg:px-8">
      <div
        class="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Ingin ikut mendukung anak-anak Amanah Umat?
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Setiap dukungan dapat membantu memenuhi kebutuhan dan mendukung
          kegiatan anak-anak di panti.
        </p>

        <router-link
          to="/donasi"
          class="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-gray-100"
        >
          Donasi Sekarang
        </router-link>
      </div>
    </section>
  </div>
</template>
```
