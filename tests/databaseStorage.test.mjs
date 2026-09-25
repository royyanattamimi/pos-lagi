import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { refundToTransaction } from '../src/storage/refund.ts'

function load(path, supabase) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const exports = {}
  new Function('exports', 'require', outputText)(exports, (name) => name === './refund' ? { refundToTransaction } : { supabase })
  return exports
}

function fakeQuery(result, calls) {
  const query = { then: (resolve) => Promise.resolve(result).then(resolve) }
  for (const method of ['insert', 'update', 'eq', 'select', 'order', 'range']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query }
  }
  return query
}

test('shift saves compare original database data before updating and reject stale writes', async () => {
  const calls = []
  const api = load('../src/storage/shiftStorage.ts', { from: () => fakeQuery({ data: [], error: null }, calls) })
  const original = { id: 'shift-1', status: 'Berjalan' }
  await assert.rejects(api.saveRemoteShift({ ...original, status: 'Selesai' }, original), /perangkat lain/)
  assert.ok(calls.some(([method, field, value]) => method === 'eq' && field === 'data' && value === JSON.stringify(original)))
})

test('shift insert returns only after server acknowledgement and surfaces storage failure', async () => {
  const calls = []
  const api = load('../src/storage/shiftStorage.ts', { from: () => fakeQuery({ data: null, error: { message: 'Offline' } }, calls) })
  await assert.rejects(api.saveRemoteShift({ id: 'shift-1' }), /Offline/)
  assert.equal(calls[0][0], 'insert')
})

test('payments use one atomic RPC and retry with the same receipt ID', async () => {
  const calls = []
  const api = load('../src/storage/transactionStorage.ts', { rpc: async (...args) => { calls.push(args); return { error: null } } })
  const receipt = { id: 'receipt-1', items: [{ productId: 1 }], shiftId: 'shift-1' }
  await api.createRemoteTransaction(receipt)
  await api.createRemoteTransaction(receipt)
  assert.deepEqual(calls, [ ['save_pos_transaction', { receipt }], ['save_pos_transaction', { receipt }] ])
})

test('missing database configuration never silently accepts a payment', async () => {
  const api = load('../src/storage/transactionStorage.ts', null)
  await assert.rejects(api.createRemoteTransaction({ id: 'receipt' }), /belum dikonfigurasi/)
})

test('transaction loader paginates beyond the first page and preserves shift association', async () => {
  const ranges = []
  const api = load('../src/storage/transactionStorage.ts', { from: () => {
    const query = { select: () => query, order: () => query, range: async (start, end) => {
      ranges.push([start, end])
      return { error: null, data: Array.from({ length: start === 0 ? 500 : 1 }, (_, index) => ({ id: String(start + index), shift_id: 'shift-1', transaction_items: [] })) }
    } }
    return query
  } })
  const records = await api.loadRemoteTransactions()
  assert.equal(records.length, 501)
  assert.equal(records[500].shiftId, 'shift-1')
  assert.deepEqual(ranges, [[0, 499], [500, 999]])
})


test('missing refund migration disables only the new feature, while network errors remain visible', async () => {
  const missing = load('../src/storage/refundStorage.ts', { from: () => fakeQuery({ data: null, error: { code: 'PGRST205', message: 'Table missing' } }, []) })
  assert.deepEqual(await missing.loadRemoteRefunds(), { records: [], available: false })
  const offline = load('../src/storage/refundStorage.ts', { from: () => fakeQuery({ data: null, error: { message: 'Offline' } }, []) })
  await assert.rejects(offline.loadRemoteRefunds(), /Offline/)
})
