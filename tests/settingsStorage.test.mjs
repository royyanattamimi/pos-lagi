import assert from 'node:assert/strict'
import test from 'node:test'
import { userStorageModules } from './helpers/userStorage.mjs'

test('accounts without settings use defaults and invalid values never enable unsupported choices', async () => {
  const { settings } = userStorageModules()
  assert.deepEqual(await settings.loadSettings('a'), settings.defaultSettings)
  const normalized = settings.normalizeSettings({ storeName: '  ', receiptPaper: '999', defaultPaymentMethod: 'Unknown', defaultSalesPeriod: false, showProductImages: false, showNotesOnReceipt: false, storePhone: 123 })
  assert.equal(normalized.storeName, 'POS Lagi')
  assert.equal(normalized.receiptPaper, '80')
  assert.equal(normalized.defaultPaymentMethod, 'Cash')
  assert.equal(normalized.defaultSalesPeriod, 'weekly')
  assert.equal(normalized.showProductImages, false)
  assert.equal(normalized.showNotesOnReceipt, false)
  assert.equal(normalized.storePhone, '')
})

test('settings persist across sessions without replacing profile, and profile save preserves settings', async () => {
  const entries = new Map([['a', { name: 'Budi', branch: 'Jakarta', customField: 'keep' }]])
  const first = userStorageModules(entries)
  const preferences = { ...first.settings.defaultSettings, storeName: '  Toko Budi  ', defaultPaymentMethod: 'QRIS', receiptPaper: '58', showCashierOnReceipt: false }
  await first.settings.saveSettings('a', preferences)
  assert.equal(entries.get('a').name, 'Budi')
  assert.equal(entries.get('a').customField, 'keep')
  await first.profiles.saveProfile('a', { ...first.profiles.emptyProfile, name: 'Budi Baru' })
  const second = userStorageModules(entries)
  assert.equal((await second.profiles.loadProfile('a')).name, 'Budi Baru')
  const restored = await second.settings.loadSettings('a')
  assert.equal(restored.storeName, 'Toko Budi')
  assert.equal(restored.receiptPaper, '58')
  assert.equal(restored.defaultPaymentMethod, 'QRIS')
  assert.equal(restored.showCashierOnReceipt, false)
  assert.deepEqual(await second.settings.loadSettings('b'), second.settings.defaultSettings)
})

test('settings can initialize a missing account document and reset to defaults', async () => {
  const entries = new Map()
  const { settings, profiles } = userStorageModules(entries)
  await settings.saveSettings('a', { ...settings.defaultSettings, storeName: 'Custom' })
  assert.deepEqual(await profiles.loadProfile('a'), profiles.emptyProfile)
  await settings.saveSettings('a', settings.defaultSettings)
  assert.deepEqual(await settings.loadSettings('a'), settings.defaultSettings)
})

test('a concurrent profile change is preserved when saving settings retries', async () => {
  const entries = new Map([['a', { name: 'Before' }]])
  let changed = false
  const { settings } = userStorageModules(entries, { beforeUpdate: (rows, account) => {
    if (!changed) { rows.set(account, { name: 'Other device' }); changed = true }
  } })
  await settings.saveSettings('a', { ...settings.defaultSettings, storeName: 'Shop' })
  assert.equal(entries.get('a').name, 'Other device')
  assert.equal(entries.get('a').settings.storeName, 'Shop')
})

test('database failures and continuous conflicts are surfaced instead of falsely reporting saved settings', async () => {
  const offline = userStorageModules(new Map(), { error: { message: 'Offline' } }).settings
  await assert.rejects(offline.saveSettings('a', offline.defaultSettings), /Offline/)
  let revision = 0
  const entries = new Map([['a', { revision }]])
  const { settings } = userStorageModules(entries, { beforeUpdate: (rows, account) => rows.set(account, { revision: ++revision }) })
  await assert.rejects(settings.saveSettings('a', settings.defaultSettings), /perangkat lain/)
  assert.equal(entries.get('a').settings, undefined)
})
