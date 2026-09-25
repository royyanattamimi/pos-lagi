import type { RefundRecord, TransactionItem, TransactionRecord } from '../types'

export function refundedQuantity(item: TransactionItem, refunds: TransactionRecord[]) {
  return refunds.reduce((sum, refund) => sum + refund.items.reduce((count, line) =>
    count + (line.itemId === item.itemId ? line.quantity : 0), 0), 0)
}

export function refundPreview(transaction: TransactionRecord, refunds: TransactionRecord[], quantities: Record<string, number>) {
  const baseTotal = transaction.items.reduce((sum, item) => sum + item.total, 0)
  const previousBase = -refunds.reduce((sum, refund) => sum + refund.subtotal, 0)
  const previousAmount = -refunds.reduce((sum, refund) => sum + refund.grandTotal, 0)
  let base = 0
  for (const item of transaction.items) {
    const quantity = item.itemId ? quantities[item.itemId] ?? 0 : 0
    const already = refundedQuantity(item, refunds)
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > item.quantity - already) {
      throw new Error(`Jumlah refund ${item.name} melebihi sisa yang dapat dikembalikan.`)
    }
    base += Math.round(item.total * (already + quantity) / item.quantity) - Math.round(item.total * already / item.quantity)
  }
  return baseTotal > 0 ? Math.round(transaction.grandTotal * (previousBase + base) / baseTotal) - previousAmount : 0
}

export function refundToTransaction(refund: RefundRecord): TransactionRecord {
  return {
    id: `REFUND-${refund.id}`, kind: 'Refund', originalTransactionId: refund.transaction_id,
    shiftId: refund.shift_id, cashier: refund.cashier, createdAt: refund.created_at,
    items: refund.items.map((item) => ({ ...item, total: -Number(item.total) })),
    itemCount: -refund.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: -Number(refund.base_amount), tax: -(Number(refund.amount) - Number(refund.base_amount)),
    grandTotal: -Number(refund.amount), paid: Number(refund.amount), change: 0,
    paymentMethod: refund.payment_method, status: 'Lunas',
    refundReason: refund.reason, refundReference: refund.reference,
    originalPaymentMethod: refund.original_payment_method,
    refundCashBefore: refund.cash_before == null ? undefined : Number(refund.cash_before),
    refundCashAfter: refund.cash_after == null ? undefined : Number(refund.cash_after),
  }
}
