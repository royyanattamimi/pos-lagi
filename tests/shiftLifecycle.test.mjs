import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

process.env.TZ = 'Asia/Jakarta'

function loadModule(path, dependencies = {}, window = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  })
  const exports = {}
  new Function('exports', 'require', 'window', outputText)(exports, (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  }, window)
  return exports
}

const lifecycle = loadModule('../src/storage/shiftLifecycle.ts')
const reports = loadModule('../src/storage/shiftReport.ts')
const { closeExpiredShift, getShiftDeadline } = lifecycle
const shift = {
  id: 'shift-1', cashierName: 'Kasir', shiftTime: 'Malam', openingCash: 100000,
  note: '', startAt: '2026-09-15T16:30:00.000Z', status: 'Berjalan',
}

test('shift closes exactly at local midnight, preserving cash and original data', () => {
  const midnight = Date.parse('2026-09-15T17:00:00.000Z')
  assert.equal(getShiftDeadline(shift), midnight)
  assert.equal(closeExpiredShift(shift, midnight - 1), shift)
  assert.deepEqual(closeExpiredShift(shift, midnight), {
    ...shift, status: 'Selesai', endAt: '2026-09-15T17:00:00.000Z',
  })
  assert.equal(shift.status, 'Berjalan')
})

test('late reopening records midnight rather than the time of reopening', () => {
  const closed = closeExpiredShift(shift, Date.parse('2026-09-20T04:00:00Z'))
  assert.equal(closed.endAt, '2026-09-15T17:00:00.000Z')
  assert.equal(closeExpiredShift(closed), closed)
})

test('manual end time stays unchanged', () => {
  const closed = { ...shift, status: 'Selesai', endAt: '2026-09-15T16:45:00Z' }
  assert.equal(closeExpiredShift(closed, Date.parse('2027-01-01')), closed)
})

test('month, leap day and year boundaries follow the local calendar', () => {
  for (const [startAt, endAt] of [
    ['2026-12-31T23:59:00+07:00', '2027-01-01T00:00:00+07:00'],
    ['2024-02-28T23:59:00+07:00', '2024-02-29T00:00:00+07:00'],
    ['2024-02-29T23:59:00+07:00', '2024-03-01T00:00:00+07:00'],
  ]) {
    assert.equal(getShiftDeadline({ ...shift, startAt }), Date.parse(endAt))
  }
})

test('loading persisted data reconciles current shift and history and can save the result', () => {
  const oldShift = { ...shift, startAt: '2020-01-01T12:00:00+07:00' }
  let stored = JSON.stringify({ currentShift: oldShift, shiftHistory: [oldShift], products: [], transactions: [] })
  const storage = loadModule('../src/storage/posStorage.ts', { './shiftLifecycle': lifecycle, './shiftReport': reports }, {
    localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value } },
  })
  const loaded = storage.loadPosData()
  assert.equal(loaded.currentShift.status, 'Selesai')
  assert.equal(loaded.currentShift.endAt, '2020-01-01T17:00:00.000Z')
  assert.deepEqual(loaded.shiftHistory, [loaded.currentShift])
  storage.savePosData(loaded)
  assert.deepEqual(JSON.parse(stored), loaded)
  assert.deepEqual(storage.loadPosData(), loaded)
})

const paymentStorage = loadModule('../src/storage/posStorage.ts', { './shiftLifecycle': lifecycle, './shiftReport': reports })
const payment = {
  id: '#POS-local', createdAt: '2026-09-21T03:00:00Z', cashier: 'Kasir',
  items: [{ productId: 1, name: 'Kopi', price: 15000, quantity: 2, total: 30000 }],
  itemCount: 2, subtotal: 30000, tax: 0, grandTotal: 30000,
  paid: 50000, change: 20000, paymentMethod: 'Cash', status: 'Lunas',
}

test('an empty or stale server result preserves completed local payments without duplicates', () => {
  assert.deepEqual(paymentStorage.mergeTransactions([payment], []), [payment])
  const remote = { ...payment, id: '#POS-remote', createdAt: '2026-09-20T03:00:00Z' }
  const merged = paymentStorage.mergeTransactions([payment], [remote, { ...payment, items: [] }])
  assert.deepEqual(merged, [payment, remote])
  assert.equal(merged.reduce((sum, record) => sum + record.grandTotal, 0), 60000)
})

test('local payment survives reload and remains counted for the local sales day', () => {
  let stored
  const storage = loadModule('../src/storage/posStorage.ts', { './shiftLifecycle': lifecycle, './shiftReport': reports }, {
    localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value } },
  })
  storage.savePosData({ ...storage.emptyPosData, transactions: [payment] })
  const reloaded = storage.mergeTransactions(storage.loadPosData().transactions, [])
  const day = new Date('2026-09-21T12:00:00+07:00').toLocaleDateString('id-ID')
  const sales = reloaded.filter((record) => new Date(record.createdAt).toLocaleDateString('id-ID') === day)
  assert.equal(sales.length, 1)
  assert.equal(sales.reduce((sum, record) => sum + record.grandTotal, 0), 30000)
  assert.deepEqual(sales[0].items, payment.items)
})
