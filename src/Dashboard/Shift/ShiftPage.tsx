import { useState } from 'react'
import { Sidebar } from '../Sidebar/Sidebar'
import './ShiftPage.css'

type ShiftPageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  onLogout: () => void
}

type RecapView = 'daily' | 'monthly' | 'yearly'

const shiftRecaps = {
  daily: [
    { period: 'Hari Ini', start: '08:00', end: '-', sales: 'Rp 12.450.000', cash: 'Rp 5.200.000', status: 'Berjalan' },
    { period: 'Kemarin', start: '08:00', end: '16:05', sales: 'Rp 10.870.000', cash: 'Rp 4.750.000', status: 'Selesai' },
  ],
  monthly: [
    { period: 'Agustus 2026', start: '26 shift', end: '25 selesai', sales: 'Rp 284.300.000', cash: 'Rp 118.450.000', status: 'Aktif' },
    { period: 'Juli 2026', start: '31 shift', end: '31 selesai', sales: 'Rp 326.900.000', cash: 'Rp 132.700.000', status: 'Selesai' },
  ],
  yearly: [
    { period: '2026', start: '238 shift', end: '237 selesai', sales: 'Rp 2.840.000.000', cash: 'Rp 1.130.000.000', status: 'Aktif' },
    { period: '2025', start: '365 shift', end: '365 selesai', sales: 'Rp 3.960.000.000', cash: 'Rp 1.620.000.000', status: 'Selesai' },
  ],
}

export function ShiftPage({
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  onLogout,
}: ShiftPageProps) {
  const [isShiftOpen, setIsShiftOpen] = useState(true)
  const [recapView, setRecapView] = useState<RecapView>('daily')
  const activeRecaps = shiftRecaps[recapView]

  return (
    <main className="shift-page">
      <Sidebar
        activePage="shift"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
        onLogout={onLogout}
      />

      <section className="shift-content">
        <header className="shift-header">
          <div>
            <p>Shift</p>
            <h1>Start dan end shift</h1>
            <span>Pantau shift berjalan dan lihat rekap kasir per hari, bulan, dan tahun.</span>
          </div>
          <button type="button" onClick={() => setIsShiftOpen((currentValue) => !currentValue)}>
            {isShiftOpen ? 'End Shift' : 'Start Shift'}
          </button>
        </header>

        <section className="shift-status-grid" aria-label="Status shift">
          <article>
            <span>Status Shift</span>
            <strong>{isShiftOpen ? 'Berjalan' : 'Selesai'}</strong>
            <small>{isShiftOpen ? 'Shift dibuka pukul 08:00' : 'Shift ditutup pukul 16:05'}</small>
          </article>
          <article>
            <span>Kas Awal</span>
            <strong>Rp 500.000</strong>
            <small>Modal uang tunai saat start shift</small>
          </article>
          <article>
            <span>Estimasi Kas Akhir</span>
            <strong>Rp 5.700.000</strong>
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
            {activeRecaps.map((recap) => (
              <div className="shift-recap-row" key={recap.period}>
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
