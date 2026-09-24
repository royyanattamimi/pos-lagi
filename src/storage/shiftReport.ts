import type { ShiftSession, TransactionRecord } from '../types'

export function getShiftTransactions(shift: ShiftSession, transactions: TransactionRecord[]) {
  const start = Date.parse(shift.startAt)
  const end = shift.endAt ? Date.parse(shift.endAt) : Infinity
  return transactions.filter((transaction) => {
    if (transaction.status !== 'Lunas') return false
    const time = Date.parse(transaction.createdAt)
    if (time < start || time >= end || !Number.isFinite(time)) return false
    if (transaction.shiftId) return transaction.shiftId === shift.id
    return transaction.cashier === (shift.cashierName || '-')
  })
}

export function snapshotShift(shift: ShiftSession, transactions: TransactionRecord[]): ShiftSession {
  if (shift.status !== 'Selesai' || shift.report) return shift
  return {
    ...shift,
    report: {
      transactions: getShiftTransactions(shift, transactions),
      closingCash: null,
      closingNote: '',
      savedAt: new Date().toISOString(),
    },
  }
}

export function summarizeShift(shift: ShiftSession, transactions: TransactionRecord[]) {
  const records = shift.report?.transactions ?? getShiftTransactions(shift, transactions)
  const payments = new Map<string, { count: number; total: number }>()
  for (const transaction of records) {
    const payment = payments.get(transaction.paymentMethod) ?? { count: 0, total: 0 }
    payments.set(transaction.paymentMethod, { count: payment.count + 1, total: payment.total + transaction.grandTotal })
  }
  const sales = records.reduce((sum, record) => sum + record.grandTotal, 0)
  const cashSales = payments.get('Cash')?.total ?? 0
  return {
    records, payments: [...payments.entries()], sales, cashSales,
    items: records.reduce((sum, record) => sum + record.itemCount, 0),
    expectedCash: shift.openingCash + cashSales,
  }
}
