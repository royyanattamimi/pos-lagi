import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

function storageModule(storage) {
  const source = readFileSync(new URL('../src/storage/profileStorage.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const exports = {}
  new Function('exports', 'localStorage', outputText)(exports, storage)
  return exports
}

test('saved profile survives reload and is isolated by account', () => {
  const entries = new Map()
  const storage = { getItem: (key) => entries.get(key), setItem: (key, value) => entries.set(key, value) }
  const first = storageModule(storage)
  const profile = { ...first.emptyProfile, name: 'Budi', branch: 'Jakarta', phone: '08123456789' }
  first.saveProfile('account-a', profile)
  const reloaded = storageModule(storage)
  assert.deepEqual(reloaded.loadProfile('account-a'), profile)
  assert.deepEqual(reloaded.loadProfile('account-b'), first.emptyProfile)
})

test('invalid or malformed profile data falls back safely', () => {
  for (const raw of ['{broken', 'null', '{"name":25,"phone":null}']) {
    const storage = storageModule({ getItem: () => raw })
    assert.deepEqual(storage.loadProfile('account'), storage.emptyProfile)
  }
})

test('storage failure is surfaced so the form cannot claim it saved', () => {
  const storage = storageModule({ setItem: () => { throw new Error('Quota exceeded') } })
  assert.throws(() => storage.saveProfile('account', storage.emptyProfile), /Quota exceeded/)
})
