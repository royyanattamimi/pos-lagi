import test from 'node:test'
import assert from 'node:assert/strict'
import { getShiftTransactions, snapshotShift, summarizeShift } from '../src/storage/shiftReport.ts'
import { closeExpiredShift } from '../src/storage/shiftLifecycle.ts'

const shift = {
  id: 'shift-1', cashierName: 'Kasir', openingCash: 100000, note: 'Modal', shiftTime: '',
  startAt: '2026-09-24T08:00:00+07:00', endAt: '2026-09-24T12:00:00+07:00', status: 'Selesai',
}
const transaction = (id, paymentMethod, grandTotal, extra = {}) => ({
  id, cashier: 'Kasir', createdAt: '2026-09-24T10:00:00+07:00', status: 'Lunas',
  items: [], itemCount: 2, subtotal: grandTotal, tax: 0, grandTotal, paid: 100000, change: 100000 - grandTotal,
  paymentMethod, ...extra,
})

test('isolates each shift by identity, cashier, and time with an exclusive end boundary', () => {
  const records = [
    transaction('included', 'Cash', 20000),
    transaction('linked', 'Cash', 20000, { shiftId: shift.id, cashier: 'Renamed' }),
    transaction('other-shift', 'Cash', 20000, { shiftId: 'shift-2' }),
    transaction('other-cashier', 'Cash', 20000, { cashier: 'Other' }),
    transaction('before', 'Cash', 20000, { createdAt: '2026-09-24T07:59:59+07:00' }),
    transaction('boundary', 'Cash', 20000, { createdAt: shift.endAt }),
  ]
  assert.deepEqual(getShiftTransactions(shift, records).map((record) => record.id), ['included', 'linked'])
})

test('cash reconciliation excludes noncash sales and uses net sales instead of tendered money', () => {
  const result = summarizeShift(shift, [transaction('cash', 'Cash', 20000), transaction('qris', 'QRIS', 30000)])
  assert.equal(result.sales, 50000)
  assert.equal(result.expectedCash, 120000)
  assert.equal(result.items, 4)
  assert.deepEqual(result.payments, [['Cash', { count: 1, total: 20000 }], ['QRIS', { count: 1, total: 30000 }]])
})

test('saved report survives serialization and later transactions do not change its totals', () => {
  const saved = snapshotShift(shift, [transaction('cash', 'Cash', 20000)])
  saved.report.closingCash = 119000
  saved.report.closingNote = 'Kurang Rp 1.000'
  const restored = JSON.parse(JSON.stringify(saved))
  assert.equal(summarizeShift(restored, [transaction('later', 'Cash', 50000)]).sales, 20000)
  assert.equal(restored.report.closingCash, 119000)
  assert.equal(restored.report.closingNote, 'Kurang Rp 1.000')
  assert.equal(snapshotShift(restored, []), restored)
})

test('automatically closed and empty shifts can be reported without inventing physical cash', () => {
  const active = { ...shift, status: 'Berjalan', endAt: undefined }
  const closed = closeExpiredShift(active, Date.parse('2026-09-26T00:00:00Z'))
  const saved = snapshotShift(closed, [])
  assert.equal(saved.status, 'Selesai')
  assert.equal(saved.report.closingCash, null)
  assert.equal(summarizeShift(saved, []).expectedCash, 100000)
  assert.equal(snapshotShift(active, []), active)
})
