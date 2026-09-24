import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDailyReports, summarizePayments, reportDateKey } from '../src/storage/dailyReport.ts'

const record = (id, paymentMethod, grandTotal, createdAt = '2026-09-24T10:00:00+07:00') => ({
  id, paymentMethod, grandTotal, createdAt, status: 'Lunas', cashier: 'Kasir',
  itemCount: 1, items: [], subtotal: grandTotal, tax: 0, paid: 100000, change: 100000 - grandTotal,
})
const shift = (id, records = []) => ({
  id, cashierName: 'Kasir', openingCash: 500000, note: '', shiftTime: '',
  startAt: '2026-09-24T09:00:00+07:00', status: 'Selesai',
  report: { transactions: records, closingCash: null, closingNote: '', savedAt: '2026-09-24T15:00:00+07:00' },
})

test('daily report combines multiple shifts and deduplicates saved and live receipts', () => {
  const cash = record('1', 'Cash', 25000)
  const qris = record('2', 'QRIS', 30000)
  const debit = record('3', 'Debit', 45000)
  const [day] = buildDailyReports([shift('a', [cash]), shift('b', [qris, cash])], [cash, debit])
  assert.equal(day.total, 100000)
  assert.equal(day.records.length, 3)
  assert.equal(day.shifts.length, 2)
  assert.deepEqual(day.payments, [
    ['Cash', { count: 1, total: 25000 }],
    ['QRIS', { count: 1, total: 30000 }],
    ['Debit', { count: 1, total: 45000 }],
  ])
})

test('days follow local receipt date including the midnight boundary', () => {
  const before = record('before', 'Cash', 100, new Date(2026, 8, 24, 23, 59, 59).toISOString())
  const after = record('after', 'Debit', 200, new Date(2026, 8, 25, 0, 0, 0).toISOString())
  const days = buildDailyReports([], [before, after])
  assert.deepEqual(days.map((day) => [day.date, day.total]), [['2026-09-25', 200], ['2026-09-24', 100]])
  assert.equal(reportDateKey(after.createdAt), '2026-09-25')
})

test('zero sales still lists all payment methods and excludes opening cash', () => {
  const [day] = buildDailyReports([shift('empty')], [])
  assert.equal(day.total, 0)
  assert.deepEqual(day.payments.map(([method, payment]) => [method, payment.total]), [['Cash', 0], ['QRIS', 0], ['Debit', 0]])
})

test('unknown payment methods are included so totals still reconcile', () => {
  const summary = summarizePayments([record('transfer', 'Transfer', 15000)])
  assert.equal(summary.total, 15000)
  assert.equal(summary.payments.reduce((sum, [, payment]) => sum + payment.total, 0), summary.total)
})

test('daily ledger excludes unpaid records and uses current receipt once if snapshot also exists', () => {
  const original = record('receipt', 'Cash', 10000)
  const current = record('receipt', 'Cash', 15000)
  const unpaid = { ...record('unpaid', 'Debit', 50000), status: 'Pending' }
  const [day] = buildDailyReports([shift('a', [original])], [current, unpaid])
  assert.equal(day.records.length, 1)
  assert.equal(day.total, 15000)
})
