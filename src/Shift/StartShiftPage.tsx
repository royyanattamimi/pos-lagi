import { useState } from 'react'
import type { FormEvent } from 'react'
import './StartShiftPage.css'

type StartShiftPageProps = {
  onStartShift: () => void
  onBackToLogin: () => void
}

const rupiahFormatter = new Intl.NumberFormat('id-ID')

function formatRupiah(value: string) {
  if (!value) return ''

  return `Rp ${rupiahFormatter.format(Number(value))}`
}

export function StartShiftPage({ onStartShift, onBackToLogin }: StartShiftPageProps) {
  const [cashierName, setCashierName] = useState('Admin Kasir')
  const [shiftTime, setShiftTime] = useState('08:00 - 16:00')
  const [openingCash, setOpeningCash] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onStartShift()
  }

  function handleOpeningCashChange(value: string) {
    setOpeningCash(value.replace(/\D/g, ''))
  }

  return (
    <main className="start-shift-page">
      <section className="start-shift-card">
        <div className="shift-brand">
          <span>PL</span>
          <div>
            <strong>POS Lagi</strong>
            <small>Start Shift</small>
          </div>
        </div>

        <div className="shift-heading">
          <p>Shift Kasir</p>
          <h1>Mulai shift sebelum transaksi</h1>
          <span>Isi data kas awal agar operasional kasir hari ini tercatat rapi.</span>
        </div>

        <form className="shift-form" onSubmit={handleSubmit}>
          <label>
            Nama Kasir
            <input
              value={cashierName}
              onChange={(event) => setCashierName(event.target.value)}
              placeholder="Nama kasir"
            />
          </label>

          <label>
            Pilih Shift
            <select value={shiftTime} onChange={(event) => setShiftTime(event.target.value)}>
              <option>08:00 - 16:00</option>
              <option>16:00 - 22:00</option>
              <option>22:00 - 06:00</option>
            </select>
          </label>

          <label>
            Kas Awal
            <input
              inputMode="numeric"
              value={formatRupiah(openingCash)}
              onChange={(event) => handleOpeningCashChange(event.target.value)}
              placeholder="Contoh: Rp 500.000"
            />
          </label>

          <label>
            Catatan
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Opsional, contoh: uang receh sudah lengkap"
            />
          </label>

          <div className="shift-actions">
            <button className="secondary-shift-button" type="button" onClick={onBackToLogin}>
              Kembali
            </button>
            <button className="primary-shift-button" type="submit">
              Start Shift
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
