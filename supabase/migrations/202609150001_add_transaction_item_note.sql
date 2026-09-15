alter table public.transaction_items
  add column if not exists note text;
