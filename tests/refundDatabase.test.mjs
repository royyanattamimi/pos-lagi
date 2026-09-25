import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const user = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const requestId = () => crypto.randomUUID()

test('refund SQL executes with permissions, quantity limits, rounding, and idempotency', async (t) => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
    create role authenticated;
    create role anon;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    insert into auth.users values ('${user}'), ('${other}');
  `)
  await db.exec(readFileSync(new URL('../supabase/migrations/202609240001_database_storage.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('../supabase/migrations/202609250001_refunds.sql', import.meta.url), 'utf8'))
  // Ensure the refund migration is safe to apply again.
  await db.exec(readFileSync(new URL('../supabase/migrations/202609250001_refunds.sql', import.meta.url), 'utf8'))
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user])
  await db.exec('set role authenticated')
  await db.query('insert into public.shift_sessions(id, data) values ($1, $2::jsonb)', ['shift-1', JSON.stringify({ id: 'shift-1', status: 'Berjalan', cashierName: 'Budi', openingCash: 50000 })])
  const receipt = {
    id: 'sale-1', cashier: 'Budi', createdAt: new Date().toISOString(), itemCount: 3,
    subtotal: 30000, tax: 1, grandTotal: 30001, paid: 40000, change: 9999,
    paymentMethod: 'Cash', status: 'Lunas', shiftId: 'shift-1',
    items: [{ productId: 1, name: 'Kopi', price: 10000, quantity: 3, total: 30000 }],
  }
  await db.query('select public.save_pos_transaction($1::jsonb)', [JSON.stringify(receipt)])
  const itemId = String((await db.query('select id from public.transaction_items')).rows[0].id)
  const input = { id: requestId(), transactionId: receipt.id, shiftId: 'shift-1', reason: 'Rusak', paymentMethod: 'Cash', reference: '', items: [{ itemId, quantity: 1 }] }
  const refund = async (request) => (await db.query('select public.create_pos_refund($1::jsonb) as result', [JSON.stringify(request)])).rows[0].result

  await t.test('authenticated clients cannot write refund rows directly', async () => {
    await assert.rejects(db.query('delete from public.refunds'), /permission denied/)
    await assert.rejects(db.query('insert into public.refunds(id) values ($1)', [requestId()]), /permission denied/)
  })
  await t.test('valid refund is calculated server-side and retries do not duplicate it', async () => {
    const first = await refund({ ...input, amount: 999999 })
    assert.equal(Number(first.amount), 10000)
    assert.equal(first.user_id, user)
    assert.equal(Number(first.items[0].quantity), 1)
    const retried = await refund(input)
    assert.equal(retried.id, first.id)
    assert.equal(Number((await db.query('select count(*) from public.refunds')).rows[0].count), 1)
    const revision = (await db.query("select data->>'refundRevision' as revision from public.shift_sessions")).rows[0].revision
    assert.equal(revision, '1')
  })
  await t.test('rejects excessive quantities, invalid items, duplicate items, missing reason and noncash reference', async () => {
    await assert.rejects(refund({ ...input, id: requestId(), items: [{ itemId, quantity: 3 }] }), /melebihi/)
    await assert.rejects(refund({ ...input, id: requestId(), items: [{ itemId: '999999', quantity: 1 }] }), /bukan bagian/)
    await assert.rejects(refund({ ...input, id: requestId(), items: [input.items[0], input.items[0]] }), /duplikat/)
    await assert.rejects(refund({ ...input, id: requestId(), reason: ' ' }), /Alasan/)
    await assert.rejects(refund({ ...input, id: requestId(), paymentMethod: 'QRIS' }), /Referensi/)
    assert.equal(Number((await db.query('select count(*) from public.refunds')).rows[0].count), 1)
  })
  await t.test('another account cannot use the current cashier shift', async () => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [other])
    await assert.rejects(refund({ ...input, id: requestId() }), /shift aktif/)
    await assert.rejects(refund(input), /sudah dipakai/)
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user])
  })
  await t.test('partial then full refund sums exactly to original payment and rejects any extra refund', async () => {
    const second = await refund({ ...input, id: requestId(), paymentMethod: 'QRIS', reference: 'QR-123' })
    assert.equal(Number(second.amount), 10001)
    const third = await refund({ ...input, id: requestId() })
    assert.equal(Number(third.amount), 10000)
    assert.equal(Number((await db.query('select sum(amount) as total from public.refunds')).rows[0].total), 30001)
    await assert.rejects(refund({ ...input, id: requestId() }), /melebihi/)
    assert.equal(Number((await db.query('select grand_total from public.transactions')).rows[0].grand_total), 30001)
  })
  await t.test('closed shifts reject new refunds, but saved requests remain safely retryable', async () => {
    await db.exec(`update public.shift_sessions set data = jsonb_set(data, '{status}', '"Selesai"')`)
    await assert.rejects(refund({ ...input, id: requestId() }), /shift aktif/)
    assert.equal((await refund(input)).id, input.id)
  })
  await t.test('anonymous users cannot run refund function', async () => {
    await db.exec('reset role; set role anon')
    await assert.rejects(refund({ ...input, id: requestId() }), /permission denied/)
  })
  await t.test('cash-only upgrade preserves old refunds and enforces cash payout reconciliation', async () => {
    await db.exec('reset role')
    const migration = readFileSync(new URL('../supabase/migrations/202609250002_cash_refunds.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration)
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user])
    await db.exec('set role authenticated')
    assert.equal(Number((await db.query('select sum(amount) as total from public.refunds')).rows[0].total), 30001)
    assert.equal((await db.query("select payment_method from public.refunds where reference = 'QR-123'")).rows[0].payment_method, 'QRIS')
    await db.query('insert into public.shift_sessions(id, data) values ($1, $2::jsonb)', ['cash-shift', JSON.stringify({ id: 'cash-shift', status: 'Berjalan', cashierName: 'Budi', openingCash: 25000, startAt: new Date().toISOString() })])
    const qris = { ...receipt, id: 'qris-sale', shiftId: 'cash-shift', paymentMethod: 'QRIS', itemCount: 2, subtotal: 20000, tax: 0, grandTotal: 20000, paid: 20000, change: 0, items: [{ productId: 1, name: 'Kopi', price: 10000, quantity: 2, total: 20000 }] }
    await db.query('select public.save_pos_transaction($1::jsonb)', [JSON.stringify(qris)])
    const qrisItem = String((await db.query("select id from public.transaction_items where transaction_id = 'qris-sale'")).rows[0].id)
    const cashInput = { ...input, id: requestId(), transactionId: qris.id, shiftId: 'cash-shift', paymentMethod: 'Cash', expectedAmount: 10000, cashConfirmed: true, items: [{ itemId: qrisItem, quantity: 1 }] }
    await assert.rejects(refund({ ...cashInput, paymentMethod: 'QRIS', reference: 'QR-ref' }), /harus dikembalikan secara tunai/)
    await assert.rejects(refund({ ...cashInput, cashConfirmed: false }), /Konfirmasi penyerahan/)
    await assert.rejects(refund({ ...cashInput, expectedAmount: 9999 }), /Nominal refund berubah/)
    const paid = await refund(cashInput)
    assert.equal(paid.payment_method, 'Cash')
    assert.equal(paid.original_payment_method, 'QRIS')
    assert.equal(Number(paid.cash_before), 25000)
    assert.equal(Number(paid.cash_after), 15000)
    assert.equal((await refund(cashInput)).id, paid.id)
    const next = await refund({ ...cashInput, id: requestId() })
    assert.equal(Number(next.cash_before), 15000)
    assert.equal(Number(next.cash_after), 5000)

    const debit = { ...qris, id: 'debit-sale', paymentMethod: 'Debit' }
    await db.query('select public.save_pos_transaction($1::jsonb)', [JSON.stringify(debit)])
    const debitItem = String((await db.query("select id from public.transaction_items where transaction_id = 'debit-sale'")).rows[0].id)
    const debitInput = { ...cashInput, id: requestId(), transactionId: debit.id, items: [{ itemId: debitItem, quantity: 1 }] }
    await assert.rejects(refund(debitInput), /Kas shift tidak cukup/)
    assert.equal(Number((await db.query("select count(*) from public.refunds where transaction_id = 'debit-sale'")).rows[0].count), 0)

    const cashSale = { ...qris, id: 'cash-sale', paymentMethod: 'Cash' }
    await db.query('select public.save_pos_transaction($1::jsonb)', [JSON.stringify(cashSale)])
    const afterCashSale = await refund(debitInput)
    assert.equal(afterCashSale.original_payment_method, 'Debit')
    assert.equal(Number(afterCashSale.cash_before), 25000)
    assert.equal(Number(afterCashSale.cash_after), 15000)
    assert.equal(Number((await db.query("select grand_total from public.transactions where id = 'qris-sale'")).rows[0].grand_total), 20000)
  })

})
