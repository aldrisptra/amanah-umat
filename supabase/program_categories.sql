-- Jalankan di Supabase Dashboard > SQL Editor untuk Kelola Program.
begin;
create table if not exists public.program_categories (
 name text primary key check (length(trim(name)) between 1 and 60 and lower(trim(name)) <> 'semua')
);
alter table public.program_categories enable row level security;
drop policy if exists program_categories_read on public.program_categories;
create policy program_categories_read on public.program_categories for select to anon, authenticated using (true);
drop policy if exists program_categories_insert on public.program_categories;
create policy program_categories_insert on public.program_categories for insert to authenticated with check (true);
drop policy if exists program_categories_update on public.program_categories;
create policy program_categories_update on public.program_categories for update to authenticated using (true) with check (true);
drop policy if exists program_categories_delete on public.program_categories;
create policy program_categories_delete on public.program_categories for delete to authenticated using (true);
-- Pertahankan kategori program yang sudah ada.
insert into public.program_categories (name)
select distinct category from public.programs where nullif(trim(category), '') is not null
on conflict do nothing;
update public.programs set category = null where trim(category) = '';
-- Database menangani perubahan nama dan penghapusan dalam satu transaksi.
-- Menghapus jenis kegiatan hanya mengosongkan kategori; program tetap ada.
alter table public.programs drop constraint if exists programs_category_reference;
alter table public.programs add constraint programs_category_reference
 foreign key (category) references public.program_categories(name)
 on update cascade on delete set null;
notify pgrst, 'reload schema';
commit;
