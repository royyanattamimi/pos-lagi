import type { Product, ShiftSession, TransactionRecord } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'pos-lagi:data:v1'
const SUPABASE_STORE_ID = 'default'

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
      currentShift: parsedData.currentShift ?? null,
      shiftHistory: Array.isArray(parsedData.shiftHistory) ? parsedData.shiftHistory : [],
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

export async function loadRemotePosData(): Promise<PosStoredData> {
  const localData = loadPosData()
  if (!supabase) return localData

  const { data, error } = await supabase
    .from('pos_store')
    .select('data')
    .eq('id', SUPABASE_STORE_ID)
    .maybeSingle()

  if (error) {
    console.error('Gagal memuat data Supabase:', error.message)
    return localData
  }

  if (!data?.data) return localData

  return normalizePosData(data.data)
}

export async function saveRemotePosData(data: PosStoredData) {
  savePosData(data)
  if (!supabase) return

  const { error } = await supabase
    .from('pos_store')
    .upsert({
      id: SUPABASE_STORE_ID,
      data,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Gagal menyimpan data Supabase:', error.message)
  }
}

function normalizePosData(value: unknown): PosStoredData {
  const parsedData = value as Partial<PosStoredData>

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
    currentShift: parsedData.currentShift ?? null,
    shiftHistory: Array.isArray(parsedData.shiftHistory) ? parsedData.shiftHistory : [],
  }
}
