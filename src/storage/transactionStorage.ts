import { supabase } from '../lib/supabase'
import type { TransactionItem, TransactionRecord } from '../types'

type TransactionRow = {
  id: string
  shift_id?: string
  cashier: string
  created_at: string
  item_count: number
  subtotal: number
  tax: number
  grand_total: number
  paid: number
  change: number
  payment_method: string
  status: 'Lunas'
  transaction_items?: TransactionItemRow[]
}

type TransactionItemRow = {
  id?: string | number
  note?: string | null
  product_id: number
  name: string
  price: number
  quantity: number
  total: number
}

export async function loadRemoteTransactions(
): Promise<TransactionRecord[]> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')

  const records: TransactionRecord[] = []
  for (let offset = 0; ; offset += 500) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      shift_id,
      cashier,
      created_at,
      item_count,
      subtotal,
      tax,
      grand_total,
      paid,
      change,
      payment_method,
      status,
      transaction_items (
        id,
        product_id,
        name,
        price,
        quantity,
        note,
        total
      )
    `)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499)

  if (error) {
    throw new Error(`Gagal memuat transaksi: ${error.message}`)
  }

  records.push(...data.map(mapTransactionRow))
  if (data.length < 500) return records
  }
}

export async function createRemoteTransaction(transaction: TransactionRecord) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const { error } = await supabase.rpc('save_pos_transaction', { receipt: transaction })
  if (error) throw new Error(`Transaksi belum tersimpan: ${error.message}`)
}

function mapTransactionRow(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    shiftId: row.shift_id,
    cashier: row.cashier,
    createdAt: row.created_at,
    items: Array.isArray(row.transaction_items)
      ? row.transaction_items.map(mapTransactionItemRow)
      : [],
    itemCount: Number(row.item_count),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    grandTotal: Number(row.grand_total),
    paid: Number(row.paid),
    change: Number(row.change),
    paymentMethod: row.payment_method,
    status: row.status,
  }
}

function mapTransactionItemRow(row: TransactionItemRow): TransactionItem {
  return {
    itemId: row.id == null ? undefined : String(row.id),
    productId: Number(row.product_id),
    name: row.name,
    price: Number(row.price),
    quantity: Number(row.quantity),
    total: Number(row.total),
    note: row.note || undefined,
  }
}
