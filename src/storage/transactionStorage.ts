import { supabase } from '../lib/supabase'
import type { TransactionItem, TransactionRecord } from '../types'

type TransactionRow = {
  id: string
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
  product_id: number
  name: string
  price: number
  quantity: number
  total: number
}

export async function loadRemoteTransactions(
  fallbackTransactions: TransactionRecord[],
): Promise<TransactionRecord[]> {
  if (!supabase) return fallbackTransactions

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
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
        product_id,
        name,
        price,
        quantity,
        total
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Gagal memuat transactions dari Supabase:', error.message)
    return fallbackTransactions
  }

  return Array.isArray(data) ? data.map(mapTransactionRow) : fallbackTransactions
}

export async function createRemoteTransaction(transaction: TransactionRecord) {
  if (!supabase) return

  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      id: transaction.id,
      cashier: transaction.cashier,
      created_at: transaction.createdAt,
      item_count: transaction.itemCount,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      grand_total: transaction.grandTotal,
      paid: transaction.paid,
      change: transaction.change,
      payment_method: transaction.paymentMethod,
      status: transaction.status,
    })

  if (transactionError) throw new Error(transactionError.message)

  const transactionItems = transaction.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.total,
  }))

  const { error: itemError } = await supabase
    .from('transaction_items')
    .insert(transactionItems)

  if (itemError) throw new Error(itemError.message)
}

function mapTransactionRow(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
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
    productId: Number(row.product_id),
    name: row.name,
    price: Number(row.price),
    quantity: Number(row.quantity),
    total: Number(row.total),
  }
}
