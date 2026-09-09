create table if not exists public.products (
  id bigint primary key,
  name text not null,
  category text not null,
  price integer not null check (price > 0),
  image text not null default '/product-images/snack-real.png',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Allow authenticated read products" on public.products;
create policy "Allow authenticated read products"
on public.products
for select
to authenticated
using (true);

drop policy if exists "Allow authenticated insert products" on public.products;
create policy "Allow authenticated insert products"
on public.products
for insert
to authenticated
with check (true);

drop policy if exists "Allow authenticated update products" on public.products;
create policy "Allow authenticated update products"
on public.products
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Allow authenticated delete products" on public.products;
create policy "Allow authenticated delete products"
on public.products
for delete
to authenticated
using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create index if not exists products_category_idx on public.products (category);
create index if not exists products_name_idx on public.products (name);
