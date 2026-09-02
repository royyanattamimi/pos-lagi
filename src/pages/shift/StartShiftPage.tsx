import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import type { ShiftInput } from '../../types'
import './StartShiftPage.css'

type StartShiftPageProps = {
  onStartShift: (data: ShiftInput) => void
  onBackToLogin: () => void
}

const rupiahFormatter = new Intl.NumberFormat('id-ID')

function formatRupiah(value: string) {
  if (!value) return ''

  return `Rp ${rupiahFormatter.format(Number(value))}`
}

export function StartShiftPage({ onStartShift, onBackToLogin }: StartShiftPageProps) {
  const [cashierName, setCashierName] = useState('')
  const [shiftTime, setShiftTime] = useState('')
  const [openingCash, setOpeningCash] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onStartShift({
      cashierName: cashierName.trim(),
      shiftTime,
      openingCash: Number(openingCash || 0),
      note: note.trim(),
    })
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
            <Input
              value={cashierName}
              onChange={(event) => setCashierName(event.target.value)}
              placeholder="Nama kasir"
            />
          </label>

          <label>
            Pilih Shift
            <Select value={shiftTime} onChange={(event) => setShiftTime(event.target.value)}>
              <option value="">Pilih jam shift</option>
              <option>08:00 - 16:00</option>
              <option>16:00 - 22:00</option>
              <option>22:00 - 06:00</option>
            </Select>
          </label>

          <label>
            Kas Awal
            <Input
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
            <Button className="secondary-shift-button" type="button" onClick={onBackToLogin}>
              Kembali
            </Button>
            <Button className="primary-shift-button" variant="primary" size="large" type="submit">
              Start Shift
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
