import { useState } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import type { ShiftSession, TransactionRecord } from '../../types'
import './ShiftPage.css'

type ShiftPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  currentShift: ShiftSession | null
  shiftHistory: ShiftSession[]
  transactions: TransactionRecord[]
  onEndShift: () => void
}

type RecapView = 'daily' | 'monthly' | 'yearly'

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

function formatTime(value?: string) {
  if (!value) return '-'

  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPeriodKey(value: string, view: RecapView) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (view === 'yearly') return String(year)
  if (view === 'monthly') return `${year}-${month}`

  return `${year}-${month}-${day}`
}

function getDateInputValue(value = new Date()) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatPeriod(value: string, view: RecapView) {
  const date = new Date(value)

  if (view === 'yearly') {
    return date.toLocaleDateString('id-ID', { year: 'numeric' })
  }

  if (view === 'monthly') {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function ShiftPage({
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  currentShift,
  shiftHistory,
  transactions,
  onEndShift,
}: ShiftPageProps) {
  const [recapView, setRecapView] = useState<RecapView>('daily')
  const [selectedDate, setSelectedDate] = useState(getDateInputValue())
  const isShiftOpen = currentShift?.status === 'Berjalan'
  const cashSales = transactions
    .filter((transaction) => transaction.paymentMethod === 'Cash')
    .reduce((total, transaction) => total + transaction.grandTotal, 0)
  const estimatedCash = (currentShift?.openingCash ?? 0) + cashSales
  const selectedDateTransactions = transactions.filter(
    (transaction) => getPeriodKey(transaction.createdAt, 'daily') === selectedDate,
  )
  const selectedDateSales = selectedDateTransactions.reduce(
    (total, transaction) => total + transaction.grandTotal,
    0,
  )
  const selectedDateCash = selectedDateTransactions
    .filter((transaction) => transaction.paymentMethod === 'Cash')
    .reduce((total, transaction) => total + transaction.grandTotal, 0)
  const periodKeys = Array.from(
    new Set([
      ...shiftHistory.map((shift) => getPeriodKey(shift.startAt, recapView)),
      ...transactions.map((transaction) => getPeriodKey(transaction.createdAt, recapView)),
    ]),
  )
  const activeRecaps = periodKeys.map((periodKey) => {
    const periodShifts = shiftHistory.filter((shift) => getPeriodKey(shift.startAt, recapView) === periodKey)
    const periodTransactions = transactions.filter(
      (transaction) => getPeriodKey(transaction.createdAt, recapView) === periodKey,
    )
    const periodSales = periodTransactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
    const periodCashSales = periodTransactions
      .filter((transaction) => transaction.paymentMethod === 'Cash')
      .reduce((total, transaction) => total + transaction.grandTotal, 0)
    const openingCash = periodShifts.reduce((total, shift) => total + shift.openingCash, 0)
    const firstShift = periodShifts[0]
    const finishedShifts = periodShifts.filter((shift) => shift.status === 'Selesai').length

    return {
      period: formatPeriod(firstShift?.startAt ?? periodTransactions[0].createdAt, recapView),
      start: recapView === 'daily' ? formatTime(firstShift?.startAt) : `${periodShifts.length} shift`,
      end: recapView === 'daily' ? formatTime(firstShift?.endAt) : `${finishedShifts} selesai`,
      sales: formatCurrency(periodSales),
      cash: formatCurrency(openingCash + periodCashSales),
      status: periodShifts.some((shift) => shift.status === 'Berjalan') ? 'Berjalan' : 'Selesai',
    }
  })

  return (
    <main className="shift-page">
      <Sidebar
        activePage="shift"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="shift-content">
        <PageHeader
          eyebrow="Shift"
          title="Start dan end shift"
          description="Pantau shift berjalan dan lihat rekap kasir per hari, bulan, dan tahun."
          actions={(
            <Button variant="danger" type="button" onClick={onEndShift} disabled={!isShiftOpen}>
              {isShiftOpen ? 'End Shift' : 'Shift Selesai'}
            </Button>
          )}
        />

        <section className="shift-status-grid" aria-label="Status shift">
          <article>
            <span>Status Shift</span>
            <strong>{isShiftOpen ? 'Berjalan' : 'Selesai'}</strong>
            <small>
              {currentShift
                ? `Start ${formatTime(currentShift.startAt)} - End ${formatTime(currentShift.endAt)}`
                : 'Belum ada shift'}
            </small>
          </article>
          <article>
            <span>Kas Awal</span>
            <strong>{formatCurrency(currentShift?.openingCash ?? 0)}</strong>
            <small>Modal uang tunai saat start shift</small>
          </article>
          <article>
            <span>Estimasi Kas Akhir</span>
            <strong>{formatCurrency(estimatedCash)}</strong>
            <small>Kas awal + pembayaran cash</small>
          </article>
        </section>

        <section className="shift-date-panel" aria-label="Cek transaksi berdasarkan tanggal">
          <div className="shift-date-control">
            <label>
              Cek Tanggal Transaksi
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
          </div>

          <div className="shift-date-summary">
            <article>
              <span>Total Transaksi</span>
              <strong>{selectedDateTransactions.length}</strong>
            </article>
            <article>
              <span>Total Penjualan</span>
              <strong>{formatCurrency(selectedDateSales)}</strong>
            </article>
            <article>
              <span>Cash</span>
              <strong>{formatCurrency(selectedDateCash)}</strong>
            </article>
          </div>

          <div className="shift-date-transactions">
            {selectedDateTransactions.length === 0 ? (
              <span>Belum ada transaksi pada tanggal ini.</span>
            ) : selectedDateTransactions.map((transaction) => (
              <div className="shift-date-row" key={transaction.id}>
                <div>
                  <strong>{transaction.id}</strong>
                  <span>{formatTime(transaction.createdAt)} - {transaction.cashier}</span>
                </div>
                <span>{transaction.itemCount} item</span>
                <span>{transaction.paymentMethod}</span>
                <strong>{formatCurrency(transaction.grandTotal)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="shift-panel">
          <div className="shift-panel-header">
            <div>
              <p>Rekapan</p>
              <h2>Rekap shift</h2>
            </div>
            <div className="recap-tabs">
              <Button
                className={recapView === 'daily' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('daily')}
              >
                Per Hari
              </Button>
              <Button
                className={recapView === 'monthly' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('monthly')}
              >
                Per Bulan
              </Button>
              <Button
                className={recapView === 'yearly' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('yearly')}
              >
                Per Tahun
              </Button>
            </div>
          </div>

          <div className="shift-recap-table">
            {activeRecaps.length === 0 ? (
              <div className="shift-recap-row">
                <div>
                  <strong>Belum ada rekap</strong>
                  <span>Start shift dulu agar data muncul.</span>
                </div>
              </div>
            ) : activeRecaps.map((recap) => (
              <div className="shift-recap-row" key={`${recap.period}-${recap.start}`}>
                <div>
                  <strong>{recap.period}</strong>
                  <span>Status: {recap.status}</span>
                </div>
                <span>Start: {recap.start}</span>
                <span>End: {recap.end}</span>
                <strong>{recap.sales}</strong>
                <span>Cash: {recap.cash}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
