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
            Program Kami
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Kegiatan untuk tumbuh dan berkembang bersama.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Berbagai kegiatan yang diselenggarakan Panti Asuhan Amanah Umat
            untuk mendukung pendidikan, pembinaan, dan tumbuh kembang anak-anak.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         PROGRAM LIST
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="program in programs"
            :key="program.title"
            class="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <!-- Image -->
            <div class="aspect-[4/3] overflow-hidden">
              <img
                :src="program.image"
                :alt="program.title"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            <!-- Content -->
            <div class="p-7">
              <span class="text-sm font-semibold text-emerald-600">
                {{ program.category }}
              </span>

              <h2 class="mt-2 text-2xl font-bold text-gray-900">
                {{ program.title }}
              </h2>

              <p class="mt-4 leading-7 text-gray-600">
                {{ program.description }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =========================
         CTA
    ========================== -->
    <section class="px-5 pb-20 lg:px-8">
      <div
        class="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Dukung kegiatan anak-anak Amanah Umat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Dukungan dari Anda dapat membantu keberlangsungan berbagai kegiatan
          dan kebutuhan anak-anak di Panti Asuhan Amanah Umat.
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

<script setup>
const programs = [
  {
    category: "Pendidikan",
    title: "Bimbingan Belajar",
    description:
      "Kegiatan pendampingan belajar untuk membantu anak-anak memahami pelajaran dan mendukung pendidikan mereka.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1000&q=80",
  },

  {
    category: "Keagamaan",
    title: "Pembinaan Keagamaan",
    description:
      "Kegiatan keagamaan yang menjadi bagian dari pembinaan dan keseharian anak-anak di Panti Asuhan Amanah Umat.",
    image:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1000&q=80",
  },

  {
    category: "Pengembangan Diri",
    title: "Pelatihan Keterampilan",
    description:
      "Kegiatan yang membantu anak-anak mengembangkan keterampilan, kreativitas, bakat, dan kepercayaan diri.",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1000&q=80",
  },

  {
    category: "Kebersamaan",
    title: "Kegiatan Bersama",
    description:
      "Berbagai kegiatan kebersamaan yang menjadi bagian dari kehidupan anak-anak di lingkungan panti.",
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1000&q=80",
  },

  {
    category: "Kesehatan",
    title: "Kegiatan Kesehatan",
    description:
      "Kegiatan yang mendukung kesehatan dan kebugaran anak-anak selama berada di lingkungan panti.",
    image:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80",
  },

  {
    category: "Kreativitas",
    title: "Kegiatan Kreatif",
    description:
      "Kegiatan yang memberikan ruang bagi anak-anak untuk menyalurkan kreativitas dan mengembangkan minat mereka.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80",
  },
];
</script>
```
