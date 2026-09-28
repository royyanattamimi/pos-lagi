import assert from 'node:assert/strict'
import { test } from 'node:test'
import { userStorageModules } from './helpers/userStorage.mjs'

function storageModule(entries, error = null, legacy = null) {
  return userStorageModules(entries, { error, legacy }).profiles
}

test('database profiles survive a different browser and remain scoped by account', async () => {
  const entries = new Map()
  const first = storageModule(entries)
  const profile = { ...first.emptyProfile, name: 'Budi', branch: 'Jakarta' }
  await first.saveProfile('account-a', profile)
  const otherBrowser = storageModule(entries)
  assert.deepEqual(await otherBrowser.loadProfile('account-a'), profile)
  assert.deepEqual(await otherBrowser.loadProfile('account-b'), first.emptyProfile)
})

test('invalid profile fields normalize safely', async () => {
  const storage = storageModule(new Map([['account', { name: 25, phone: null }]]))
  assert.deepEqual(await storage.loadProfile('account'), storage.emptyProfile)
})

test('database read and write failures are surfaced', async () => {
  const storage = storageModule(new Map(), { message: 'Connection failed' })
  await assert.rejects(storage.saveProfile('account', storage.emptyProfile), /Connection failed/)
  await assert.rejects(storage.loadProfile('account'), /Connection failed/)
})

test('legacy profile imports only when no database profile exists', async () => {
  const entries = new Map()
  const storage = storageModule(entries, null, JSON.stringify({ name: 'Legacy' }))
  assert.equal((await storage.loadProfile('account')).name, 'Legacy')
  entries.set('account', { ...storage.emptyProfile, name: 'Database' })
  assert.equal((await storage.loadProfile('account')).name, 'Database')
})
