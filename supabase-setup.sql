-- Anand Electricals initial database and access policies.
-- Run this in Supabase Dashboard -> SQL Editor.
-- Public visitors can read active products. Only accounts whose trusted app_metadata.role is 'admin'
-- can insert/update/delete products or upload/replace/delete product images.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (char_length(category) between 1 and 60),
  price numeric(12,2) not null check (price >= 0),
  description text not null default '' check (char_length(description) <= 500),
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Remove only policies created by this setup, so rerunning the script is safe.
drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Admins can read all products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Anyone can read active products"
  on public.products for select to anon, authenticated
  using (active = true);
create policy "Admins can read all products"
  on public.products for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins can update products"
  on public.products for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins can delete products"
  on public.products for delete to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- Public product images, admin-only writes. The bucket is intentionally public for storefront display.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Anyone can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check (bucket_id = 'product-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
