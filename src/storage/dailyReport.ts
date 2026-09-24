import type { ShiftSession, TransactionRecord } from '../types'

export function reportDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function summarizePayments(records: TransactionRecord[]) {
  const payments = new Map(['Cash', 'QRIS', 'Debit'].map((method) => [method, { count: 0, total: 0 }]))
  for (const record of records) {
    const payment = payments.get(record.paymentMethod) ?? { count: 0, total: 0 }
    payments.set(record.paymentMethod, { count: payment.count + 1, total: payment.total + record.grandTotal })
  }
  return {
    payments: [...payments.entries()],
    total: records.reduce((sum, record) => sum + record.grandTotal, 0),
  }
}

export function buildDailyReports(shifts: ShiftSession[], transactions: TransactionRecord[]) {
  // Use the transaction ledger, with saved reports as a fallback; count each receipt once.
  const unique = new Map<string, TransactionRecord>()
  for (const shift of shifts) {
    for (const record of shift.report?.transactions ?? []) unique.set(record.id, record)
  }
  for (const record of transactions) unique.set(record.id, record)
  const days = new Map<string, { date: string; records: TransactionRecord[]; shifts: ShiftSession[] }>()
  function getDay(date: string) {
    let day = days.get(date)
    if (!day) {
      day = { date, records: [], shifts: [] }
      days.set(date, day)
    }
    return day
  }
  for (const shift of shifts) getDay(reportDateKey(shift.startAt)).shifts.push(shift)
  for (const record of unique.values()) {
    if (record.status === 'Lunas' && Number.isFinite(Date.parse(record.createdAt))) {
      getDay(reportDateKey(record.createdAt)).records.push(record)
    }
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date)).map((day) => ({
    ...day,
    records: day.records.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    ...summarizePayments(day.records),
  }))
}
