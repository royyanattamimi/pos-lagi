import { loadUserDocument, patchUserDocument } from './userDocument'

export type AppSettings = {
  storeName: string
  storeAddress: string
  storePhone: string
  receiptFooter: string
  receiptPaper: '58' | '80'
  showCashierOnReceipt: boolean
  showNotesOnReceipt: boolean
  showProductImages: boolean
  defaultPaymentMethod: 'Cash' | 'QRIS' | 'Debit'
  defaultSalesPeriod: 'weekly' | 'monthly' | 'yearly'
}

export const defaultSettings: AppSettings = {
  storeName: 'POS Lagi', storeAddress: '', storePhone: '',
  receiptFooter: 'Terima kasih atas kunjungan Anda.', receiptPaper: '80',
  showCashierOnReceipt: true, showNotesOnReceipt: true, showProductImages: true,
  defaultPaymentMethod: 'Cash', defaultSalesPeriod: 'weekly',
}

export function normalizeSettings(value: unknown): AppSettings {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const text = (key: keyof AppSettings, limit: number) => typeof data[key] === 'string' ? data[key].trim().slice(0, limit) : String(defaultSettings[key])
  return {
    storeName: text('storeName', 80) || defaultSettings.storeName,
    storeAddress: text('storeAddress', 250), storePhone: text('storePhone', 30),
    receiptFooter: text('receiptFooter', 200), receiptPaper: data.receiptPaper === '58' ? '58' : '80',
    showCashierOnReceipt: typeof data.showCashierOnReceipt === 'boolean' ? data.showCashierOnReceipt : true,
    showNotesOnReceipt: typeof data.showNotesOnReceipt === 'boolean' ? data.showNotesOnReceipt : true,
    showProductImages: typeof data.showProductImages === 'boolean' ? data.showProductImages : true,
    defaultPaymentMethod: data.defaultPaymentMethod === 'QRIS' || data.defaultPaymentMethod === 'Debit' ? data.defaultPaymentMethod : 'Cash',
    defaultSalesPeriod: data.defaultSalesPeriod === 'monthly' || data.defaultSalesPeriod === 'yearly' ? data.defaultSalesPeriod : 'weekly',
  }
}

export async function loadSettings(accountId: string) {
  const document = await loadUserDocument(accountId)
  return normalizeSettings(document?.settings)
}

export async function saveSettings(accountId: string, settings: AppSettings) {
  const normalized = normalizeSettings(settings)
  await patchUserDocument(accountId, { settings: normalized })
  return normalized
}
