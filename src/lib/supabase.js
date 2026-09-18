import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Kalau environment variable belum diisi (sering terjadi saat deploy pertama),
// beri pesan yang jelas supaya tidak muncul layar putih tanpa keterangan.
if (!supabaseUrl || !supabaseKey) {
  const pesan =
    "Konfigurasi Supabase belum lengkap. " +
    "Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY sudah diisi " +
    "pada file .env (lokal) atau pada Environment Variables di layanan hosting.";

  console.error(pesan);

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.innerHTML = `<div style="font-family:system-ui,sans-serif;padding:40px;max-width:640px;margin:0 auto;color:#111">
        <h1 style="font-size:20px;margin:0 0 12px">Website belum dapat dimuat</h1>
        <p style="line-height:1.7;color:#444">${pesan}</p>
      </div>`;
    });
  }

  throw new Error(pesan);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
