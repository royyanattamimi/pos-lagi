import { useState } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
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
  const isShiftOpen = currentShift?.status === 'Berjalan'
  const cashSales = transactions
    .filter((transaction) => transaction.paymentMethod === 'Cash')
    .reduce((total, transaction) => total + transaction.grandTotal, 0)
  const totalSales = transactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
  const estimatedCash = (currentShift?.openingCash ?? 0) + cashSales
  const activeRecaps = shiftHistory.map((shift) => ({
    period:
      recapView === 'daily'
        ? new Date(shift.startAt).toLocaleDateString('id-ID')
        : new Date(shift.startAt).toLocaleDateString('id-ID', {
            month: recapView === 'monthly' ? 'long' : undefined,
            year: 'numeric',
          }),
    start: formatTime(shift.startAt),
    end: formatTime(shift.endAt),
    sales: formatCurrency(totalSales),
    cash: formatCurrency(shift.openingCash + cashSales),
    status: shift.status,
  }))

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
        <header className="shift-header">
          <div>
            <p>Shift</p>
            <h1>Start dan end shift</h1>
            <span>Pantau shift berjalan dan lihat rekap kasir per hari, bulan, dan tahun.</span>
          </div>
          <button type="button" onClick={onEndShift} disabled={!isShiftOpen}>
            {isShiftOpen ? 'End Shift' : 'Shift Selesai'}
          </button>
        </header>

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

        <section className="shift-panel">
          <div className="shift-panel-header">
            <div>
              <p>Rekapan</p>
              <h2>Rekap shift</h2>
            </div>
            <div className="recap-tabs">
              <button
                className={recapView === 'daily' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('daily')}
              >
                Per Hari
              </button>
              <button
                className={recapView === 'monthly' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('monthly')}
              >
                Per Bulan
              </button>
              <button
                className={recapView === 'yearly' ? 'active' : ''}
                type="button"
                onClick={() => setRecapView('yearly')}
              >
                Per Tahun
              </button>
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
