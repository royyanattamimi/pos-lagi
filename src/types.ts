export type Product = {
  id: number
  name: string
  category: string
  price: number
  image: string
}

export type ProductInput = {
  name: string
  category: string
  price: number
  image: string
}

export type TransactionItem = {
  itemId?: string
  note?: string
  productId: number
  name: string
  price: number
  quantity: number
  total: number
}

export type TransactionRecord = {
  kind?: 'Refund'
  originalTransactionId?: string
  refundReason?: string
  refundReference?: string
  originalPaymentMethod?: string
  refundCashBefore?: number
  refundCashAfter?: number
  shiftId?: string
  id: string
  cashier: string
  createdAt: string
  items: TransactionItem[]
  itemCount: number
  subtotal: number
  tax: number
  grandTotal: number
  paid: number
  change: number
  paymentMethod: string
  status: 'Lunas'
}

export type TransactionInput = Omit<TransactionRecord, 'id' | 'createdAt' | 'status'>

export type ShiftInput = {
  cashierName: string
  shiftTime: string
  openingCash: number
  note: string
}

export type ShiftSession = ShiftInput & {
  refundRevision?: number
  id: string
  startAt: string
  endAt?: string
  report?: ShiftReport
  status: 'Berjalan' | 'Selesai'
}

export type ShiftReport = {
  transactions: TransactionRecord[]
  closingCash: number | null
  closingNote: string
  savedAt: string
}

export type RefundInput = {
  expectedAmount: number
  cashConfirmed: boolean
  id: string
  transactionId: string
  shiftId: string
  reason: string
  paymentMethod: string
  reference: string
  items: { itemId: string; quantity: number }[]
}

export type RefundRecord = {
  original_payment_method?: string
  cash_before?: number | null
  cash_after?: number | null
  id: string
  transaction_id: string
  shift_id: string
  cashier: string
  created_at: string
  reason: string
  payment_method: string
  reference: string
  amount: number
  base_amount: number
  items: (TransactionItem & { itemId: string })[]
}
