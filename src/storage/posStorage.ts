import type { Product, ShiftSession, TransactionRecord } from '../types'
import { snapshotShift } from './shiftReport'
import { closeExpiredShift } from './shiftLifecycle'

const STORAGE_KEY = 'pos-lagi:data:v1'

export type PosStoredData = {
  products: Product[]
  transactions: TransactionRecord[]
  currentShift: ShiftSession | null
  shiftHistory: ShiftSession[]
}

export const emptyPosData: PosStoredData = {
  products: [],
  transactions: [],
  currentShift: null,
  shiftHistory: [],
}

// Read-only compatibility reader for the explicit legacy import. New data is saved to Supabase.
export function loadPosData(): PosStoredData {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (!storedValue) return emptyPosData

    const parsedData = JSON.parse(storedValue) as Partial<PosStoredData>
    const now = Date.now()
    return {
      products: Array.isArray(parsedData.products)
        ? parsedData.products.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
          }))
        : [],
      transactions: Array.isArray(parsedData.transactions) ? parsedData.transactions : [],
      currentShift: parsedData.currentShift ? snapshotShift(closeExpiredShift(parsedData.currentShift, now), parsedData.transactions ?? []) : null,
      shiftHistory: Array.isArray(parsedData.shiftHistory)
        ? parsedData.shiftHistory.map((shift) => snapshotShift(closeExpiredShift(shift, now), parsedData.transactions ?? []))
        : [],
    }
  } catch {
    return emptyPosData
  }
}

// Completed local payments stay authoritative if a remote write was incomplete.
export function mergeTransactions(
  localTransactions: TransactionRecord[],
  remoteTransactions: TransactionRecord[],
): TransactionRecord[] {
  const records = new Map(remoteTransactions.map((transaction) => [transaction.id, transaction]))
  for (const transaction of localTransactions) records.set(transaction.id, transaction)
  return [...records.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}
