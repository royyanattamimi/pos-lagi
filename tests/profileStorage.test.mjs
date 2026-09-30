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

test('company details persist without turning personal identity into business data', async () => {
  const entries = new Map([['account', { name: 'Budi', email: 'budi@example.com', birthDate: '1990-01-01' }]])
  const storage = storageModule(entries)
  const previous = await storage.loadProfile('account')
  assert.equal(previous.companyName, '')
  assert.equal(previous.companyEmail, '')
  const company = {
    ...previous,
    companyName: 'Kopi Senja', businessType: 'Coffee Shop',
    companyLegalName: 'PT Kopi Senja', companyBranch: 'Kemang',
    companyEmail: 'halo@kopisenja.com', companyPhone: '+62 812 3456 7890',
    companyWebsite: 'https://kopisenja.com', companyInstagram: '@kopisenja',
    companyAddress: 'Jalan Kemang 10', companyCity: 'Jakarta Selatan',
    companyProvince: 'DKI Jakarta', companyPostalCode: '12730',
    companyOperatingHours: 'Senin–Minggu 08.00–22.00', companyDescription: 'Kopi lokal dan pastry',
  }
  await storage.saveProfile('account', company)
  const reloaded = await storageModule(entries).loadProfile('account')
  assert.deepEqual(reloaded, company)
  assert.equal(reloaded.name, 'Budi')
  assert.equal(reloaded.email, 'budi@example.com')
})
