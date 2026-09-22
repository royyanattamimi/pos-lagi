import type { ShiftSession, TransactionRecord } from '../types'

export function getNextMonthStart(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
}

export function getMonthlyCash(
  transactions: TransactionRecord[],
  shifts: ShiftSession[],
  currentShift: ShiftSession | null,
  now: Date,
): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = getNextMonthStart(now)
  const inMonth = (value: string) => {
    const time = Date.parse(value)
    return time >= start && time < end
  }
  const uniqueShifts = new Map(shifts.map((shift) => [shift.id, shift]))
  if (currentShift) uniqueShifts.set(currentShift.id, currentShift)
  const openingCash = [...uniqueShifts.values()]
    .filter((shift) => inMonth(shift.startAt))
    .reduce((sum, shift) => sum + shift.openingCash, 0)
  const cashSales = transactions
    .filter((transaction) => transaction.status === 'Lunas' && transaction.paymentMethod === 'Cash' && inMonth(transaction.createdAt))
    .reduce((sum, transaction) => sum + transaction.grandTotal, 0)
  return openingCash + cashSales
}
