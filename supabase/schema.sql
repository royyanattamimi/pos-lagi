create table if not exists public.pos_store (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pos_store enable row level security;

drop policy if exists "Allow anon read pos_store" on public.pos_store;
create policy "Allow anon read pos_store"
on public.pos_store
for select
to anon
using (true);

drop policy if exists "Allow anon write pos_store" on public.pos_store;
create policy "Allow anon write pos_store"
on public.pos_store
for insert
to anon
with check (true);

drop policy if exists "Allow anon update pos_store" on public.pos_store;
create policy "Allow anon update pos_store"
on public.pos_store
for update
to anon
using (true)
with check (true);
