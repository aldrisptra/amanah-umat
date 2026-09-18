/**
 * Animasi yang menghormati pengaturan pengguna.
 *
 * Sebagian orang mematikan animasi di pengaturan perangkatnya karena gerakan
 * membuat mereka pusing atau mual (motion sickness, vertigo, migrain). Seluruh
 * animasi di website ini memeriksa pengaturan tersebut lebih dulu.
 */

const kueriGerakan =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

export const gerakanDikurangi = kueriGerakan?.matches ?? false;

/**
 * Directive `v-reveal`: elemen muncul perlahan saat tergulir ke layar.
 *
 * Memakai IntersectionObserver, bukan pemantauan posisi gulir, supaya tidak
 * membebani ponsel kelas menengah — browser yang menghitungnya, bukan
 * JavaScript pada setiap piksel gulir.
 *
 * Pemakaian:
 *   <div v-reveal>                 -> muncul naik
 *   <div v-reveal="{ delay: 150 }"> -> muncul 150 md lebih lambat
 *   <div v-reveal="{ arah: 'kiri' }">
 */
export const reveal = {
  // Dipanggil saat komponen dirender di luar browser (uji render / prarender).
  // Directive ini murni efek visual, jadi tidak menambahkan atribut apa pun.
  getSSRProps() {
    return {};
  },

  mounted(el, binding) {
    const opsi = binding.value || {};
    const delay = Number(opsi.delay) || 0;
    const arah = opsi.arah || "bawah";

    // Bila animasi dimatikan pengguna, atau browser tidak mendukung
    // IntersectionObserver, elemen langsung tampil apa adanya.
    if (gerakanDikurangi || typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-tampil");
      return;
    }

    el.classList.add("reveal", `reveal-dari-${arah}`);

    if (delay) {
      el.style.transitionDelay = `${delay}ms`;
    }

    const pengamat = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          el.classList.add("reveal-tampil");

          // Sekali muncul, selesai. Elemen tidak disembunyikan lagi saat
          // digulir ke atas - itu justru terasa mengganggu saat membaca.
          pengamat.unobserve(el);
        });
      },
      {
        // Mulai sedikit sebelum elemen benar-benar terlihat, supaya
        // animasinya tidak tertangkap basah oleh mata pengguna.
        rootMargin: "0px 0px -80px 0px",
        threshold: 0.05,
      },
    );

    pengamat.observe(el);

    el._pengamatReveal = pengamat;
  },

  unmounted(el) {
    el._pengamatReveal?.disconnect();
    delete el._pengamatReveal;
  },
};
