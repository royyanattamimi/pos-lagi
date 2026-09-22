import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

process.env.TZ = 'Asia/Jakarta'
const { outputText } = ts.transpileModule(readFileSync(new URL('../src/storage/monthlyCash.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } })
const exports = {}
new Function('exports', outputText)(exports)
const { getMonthlyCash, getNextMonthStart } = exports
const shift = { id: 'shift-1', startAt: '2026-09-30T12:00:00+07:00', openingCash: 100000 }
const payment = { createdAt: '2026-09-30T23:59:59+07:00', paymentMethod: 'Cash', status: 'Lunas', grandTotal: 50000 }

test('monthly cash counts current-month openings once and only paid cash sales', () => {
  const previous = { ...payment, createdAt: '2026-08-31T23:59:59+07:00' }
  const next = { ...payment, createdAt: '2026-10-01T00:00:00+07:00' }
  const transactions = [payment, previous, next, { ...payment, paymentMethod: 'QRIS' }, { ...payment, status: 'Belum lunas' }]
  assert.equal(getMonthlyCash(transactions, [shift], shift, new Date('2026-09-30T23:59:59+07:00')), 150000)
})

test('month rollover resets to zero without deleting history or carrying previous opening cash', () => {
  const transactions = [payment]
  assert.equal(getMonthlyCash(transactions, [shift], shift, new Date('2026-10-01T00:00:00+07:00')), 0)
  assert.equal(transactions.length, 1)
  assert.equal(getMonthlyCash(transactions, [shift], shift, new Date('2026-09-30T23:59:59+07:00')), 150000)
})

test('new-month cash starts counting at local midnight and supports missing current shift in history', () => {
  const now = new Date('2026-10-01T00:00:00+07:00')
  const newShift = { ...shift, id: 'new', startAt: now.toISOString() }
  assert.equal(getMonthlyCash([{ ...payment, createdAt: now.toISOString() }], [shift], newShift, now), 150000)
})

test('next boundary handles year changes and leap years in local time', () => {
  assert.equal(getNextMonthStart(new Date('2026-12-31T23:59:59+07:00')), Date.parse('2027-01-01T00:00:00+07:00'))
  assert.equal(getNextMonthStart(new Date('2024-02-29T23:59:59+07:00')), Date.parse('2024-03-01T00:00:00+07:00'))
})
