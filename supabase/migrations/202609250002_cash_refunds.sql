begin;

-- Historical refund amounts/methods remain unchanged.
alter table public.refunds
  add column if not exists original_payment_method text,
  add column if not exists cash_before numeric,
  add column if not exists cash_after numeric;
update public.refunds r set original_payment_method = t.payment_method
from public.transactions t where t.id = r.transaction_id and r.original_payment_method is null;

create or replace function public.create_pos_refund(request jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  sale public.transactions%rowtype;
  active_shift public.shift_sessions%rowtype;
  existing public.refunds%rowtype;
  saved public.refunds%rowtype;
  line public.transaction_items%rowtype;
  requested_item jsonb;
  refund_items jsonb := '[]'::jsonb;
  quantity integer;
  returned_quantity integer;
  base numeric := 0;
  line_base numeric;
  original_base numeric;
  previous_base numeric;
  previous_amount numeric;
  refund_amount numeric;
  cash_before_refund numeric;
  cash_sales numeric;
  cash_refunds numeric;
begin
  if auth.uid() is null then raise exception 'Login diperlukan'; end if;
  -- Serializes refunds of the same receipt so two devices cannot over-refund.
  select * into sale from public.transactions where id = request->>'transactionId' for update;
  if not found or sale.status <> 'Lunas' then raise exception 'Transaksi lunas tidak ditemukan'; end if;

  select * into existing from public.refunds where id = (request->>'id')::uuid;
  if found then
    if existing.transaction_id <> sale.id or existing.user_id <> auth.uid() then
      raise exception 'Nomor refund sudah dipakai';
    end if;
    return to_jsonb(existing);
  end if;

  select * into active_shift from public.shift_sessions
    where id = request->>'shiftId' and user_id = auth.uid() for update;
  if not found or active_shift.data->>'status' <> 'Berjalan' then
    raise exception 'Mulai shift aktif sebelum mencatat refund';
  end if;
  if (request->>'reason') is null or length(trim(request->>'reason')) = 0 then
    raise exception 'Alasan refund wajib diisi';
  end if;
  if request->>'paymentMethod' is distinct from 'Cash' then
    raise exception 'Refund baru harus dikembalikan secara tunai dari kas shift';
  end if;
  if request->>'cashConfirmed' is distinct from 'true' then
    raise exception 'Konfirmasi penyerahan uang tunai ke pelanggan diperlukan';
  end if;
  if jsonb_typeof(request->'items') is distinct from 'array' then
    raise exception 'Pilih produk yang direfund';
  end if;
  if jsonb_array_length(request->'items') = 0 then raise exception 'Pilih produk yang direfund'; end if;
  if (select count(*) <> count(distinct item->>'itemId') from jsonb_array_elements(request->'items') item) then
    raise exception 'Item refund tidak boleh duplikat';
  end if;

  for requested_item in select value from jsonb_array_elements(request->'items') loop
    if coalesce(requested_item->>'quantity', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Jumlah refund harus bilangan bulat positif';
    end if;
    quantity := (requested_item->>'quantity')::integer;
    select * into line from public.transaction_items
      where transaction_id = sale.id and id::text = requested_item->>'itemId';
    if not found then raise exception 'Produk bukan bagian dari transaksi ini'; end if;
    select coalesce(sum((item->>'quantity')::integer), 0) into returned_quantity
      from public.refunds r cross join lateral jsonb_array_elements(r.items) item
      where r.transaction_id = sale.id and item->>'itemId' = line.id::text;
    if quantity + returned_quantity > line.quantity then
      raise exception 'Jumlah refund melebihi sisa produk yang dibeli';
    end if;
    line_base := round(line.total::numeric * (returned_quantity + quantity) / line.quantity)
      - round(line.total::numeric * returned_quantity / line.quantity);
    base := base + line_base;
    refund_items := refund_items || jsonb_build_array(jsonb_build_object(
      'itemId', line.id::text, 'productId', line.product_id, 'name', line.name,
      'price', line.price, 'quantity', quantity, 'total', line_base
    ));
  end loop;
  select sum(total) into original_base from public.transaction_items where transaction_id = sale.id;
  select coalesce(sum(base_amount), 0), coalesce(sum(amount), 0) into previous_base, previous_amount
    from public.refunds where transaction_id = sale.id;
  if coalesce(original_base, 0) <= 0 or base <= 0 then raise exception 'Nominal refund tidak valid'; end if;
  -- Allocate tax/discount proportionally; the final refund exactly matches the receipt.
  refund_amount := round(sale.grand_total * (previous_base + base) / original_base) - previous_amount;
  if refund_amount <= 0 or previous_amount + refund_amount > sale.grand_total then
    raise exception 'Nominal refund melebihi pembayaran';
  end if;
  if (request->>'expectedAmount')::numeric is distinct from refund_amount then
    raise exception 'Nominal refund berubah. Periksa ulang jumlah uang tunai dan riwayat refund';
  end if;
  -- The locked shift serializes cash payouts across devices.
  select coalesce(sum(grand_total), 0) into cash_sales from public.transactions
    where status = 'Lunas' and payment_method = 'Cash'
      and (shift_id = active_shift.id or (
        shift_id is null and cashier = coalesce(nullif(active_shift.data->>'cashierName', ''), '-')
        and created_at >= (active_shift.data->>'startAt')::timestamptz
        and created_at <= now()
      ));
  select coalesce(sum(amount), 0) into cash_refunds from public.refunds
    where shift_id = active_shift.id and payment_method = 'Cash';
  cash_before_refund := coalesce((active_shift.data->>'openingCash')::numeric, 0) + cash_sales - cash_refunds;
  if cash_before_refund < refund_amount then
    raise exception 'Kas shift tidak cukup untuk refund tunai. Kas tersedia: %, refund: %', cash_before_refund, refund_amount;
  end if;
  insert into public.refunds(id, transaction_id, shift_id, user_id, cashier, reason,
    payment_method, reference, amount, base_amount, items, original_payment_method, cash_before, cash_after)
  values ((request->>'id')::uuid, sale.id, active_shift.id, auth.uid(),
    coalesce(nullif(active_shift.data->>'cashierName', ''), '-'), trim(request->>'reason'),
    'Cash', coalesce(trim(request->>'reference'), ''), refund_amount, base, refund_items,
    sale.payment_method, cash_before_refund, cash_before_refund - refund_amount)
  returning * into saved;
  -- Make a concurrently prepared shift closure fail its compare-and-save check.
  update public.shift_sessions
    set data = jsonb_set(data, '{refundRevision}', to_jsonb(coalesce((data->>'refundRevision')::integer, 0) + 1)),
        updated_at = now()
    where id = active_shift.id;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.create_pos_refund(jsonb) from public, anon;
grant execute on function public.create_pos_refund(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
