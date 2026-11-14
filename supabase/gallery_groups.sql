-- Jalankan di Supabase SQL Editor bila kolom unit belum tersedia.
-- Tidak menghapus atau mengubah keterangan maupun foto lama.
alter table public.gallery add column if not exists unit text;

-- Kelompokkan foto lama berdasarkan label/keterangan yang menyebut TPQ/LKSA.
-- Foto tanpa petunjuk tetap tampil di Semua dan dapat ditandai lewat admin.
update public.gallery
set unit = case
  when concat_ws(' ', category, alt_text) ~* '\mTPQ\M' and concat_ws(' ', category, alt_text) ~* '\mLKSA\M' then 'keduanya'
  when concat_ws(' ', category, alt_text) ~* '\mTPQ\M' then 'tpq'
  when concat_ws(' ', category, alt_text) ~* '\mLKSA\M' then 'lksa'
end
where nullif(trim(unit), '') is null;
notify pgrst, 'reload schema';
