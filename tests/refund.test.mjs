import assert from 'node:assert/strict'
import test from 'node:test'
import { refundPreview, refundToTransaction, refundedQuantity } from '../src/storage/refund.ts'
import { buildDailyReports } from '../src/storage/dailyReport.ts'
import { getMonthlyCash } from '../src/storage/monthlyCash.ts'
import { snapshotShift, summarizeShift } from '../src/storage/shiftReport.ts'

const item = { itemId: '1', productId: 10, name: 'Kopi', price: 10000, quantity: 3, total: 30000 }
const sale = { id: 'sale-1', cashier: 'Kasir', createdAt: new Date(2026, 8, 24, 10).toISOString(), items: [item], itemCount: 3, subtotal: 30000, tax: 1, grandTotal: 30001, paid: 40000, change: 9999, paymentMethod: 'Cash', status: 'Lunas', shiftId: 'old' }
const makeRefund = (quantity, amount, method = 'Cash', id = 'r1') => refundToTransaction({
  id, transaction_id: sale.id, shift_id: 'current', cashier: 'Kasir', created_at: new Date(2026, 8, 25, 11).toISOString(), reason: 'Rusak', reference: '', payment_method: method, amount, base_amount: quantity * 10000,
  items: [{ ...item, quantity, total: quantity * 10000 }],
})

test('partial refunds prorate tax with cumulative rounding so the last refund balances exactly', () => {
  assert.equal(refundPreview(sale, [], { '1': 1 }), 10000)
  const first = makeRefund(1, 10000)
  assert.equal(refundPreview(sale, [first], { '1': 1 }), 10001)
  const second = makeRefund(1, 10001, 'Cash', 'r2')
  assert.equal(refundPreview(sale, [first, second], { '1': 1 }), 10000)
  assert.equal(refundedQuantity(item, [first, second]), 2)
  assert.throws(() => refundPreview(sale, [first, second], { '1': 2 }), /melebihi/)
  assert.throws(() => refundPreview(sale, [], { '1': -1 }), /melebihi/)
  assert.throws(() => refundPreview(sale, [], { '1': 0.5 }), /melebihi/)
})

test('refund affects its actual day and payment method while original paid receipt stays intact', () => {
  const refund = makeRefund(1, 10000, 'Debit')
  const days = buildDailyReports([], [sale, refund])
  assert.equal(days[0].date, '2026-09-25')
  assert.equal(days[0].total, -10000)
  assert.equal(days[0].refundTotal, 10000)
  assert.equal(days[0].salesCount, 0)
  assert.equal(days[0].payments.find(([method]) => method === 'Debit')[1].total, -10000)
  assert.equal(days[1].total, 30001)
  assert.equal(sale.grandTotal, 30001)
})

test('cash refund reduces current shift cash, while previous closed snapshot stays unchanged', () => {
  const old = { id: 'old', cashierName: 'Kasir', openingCash: 0, note: '', shiftTime: '', startAt: new Date(2026, 8, 24, 8).toISOString(), endAt: new Date(2026, 8, 24, 18).toISOString(), status: 'Selesai' }
  const frozen = snapshotShift(old, [sale])
  const current = { ...old, id: 'current', status: 'Berjalan', openingCash: 50000, startAt: new Date(2026, 8, 25, 8).toISOString(), endAt: undefined }
  const refund = makeRefund(1, 10000)
  const summary = summarizeShift(current, [sale, refund])
  assert.equal(summary.expectedCash, 40000)
  assert.equal(summarizeShift(frozen, [sale, refund]).sales, 30001)
  assert.equal(getMonthlyCash([sale, refund], [old, current], current, new Date(2026, 8, 25)), 70001)
})

test('noncash refunds do not reduce physical cash', () => {
  assert.equal(getMonthlyCash([sale, makeRefund(1, 10000, 'QRIS')], [], null, new Date(2026, 8, 25)), 30001)
})
