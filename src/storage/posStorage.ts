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

export function savePosData(data: PosStoredData, requireSuccess = false) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    if (requireSuccess) throw new Error('Laporan belum tersimpan. Penyimpanan browser penuh atau tidak tersedia. Coba lagi setelah ruang penyimpanan tersedia.')
    // The app remains usable when storage is unavailable or full.
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
