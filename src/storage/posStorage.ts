import type { Product, ShiftSession, TransactionRecord } from '../types'
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
      currentShift: parsedData.currentShift ? closeExpiredShift(parsedData.currentShift, now) : null,
      shiftHistory: Array.isArray(parsedData.shiftHistory)
        ? parsedData.shiftHistory.map((shift) => closeExpiredShift(shift, now))
        : [],
    }
  } catch {
    return emptyPosData
  }
}

export function savePosData(data: PosStoredData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // The app remains usable when storage is unavailable or full.
  }
}
