import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import type { ShiftInput } from '../../types'

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
  const [openingCash, setOpeningCash] = useState('')
  const [openingCashError, setOpeningCashError] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(openingCash)
    if (!openingCash || !Number.isSafeInteger(amount) || amount < 0) {
      setOpeningCashError(!openingCash
        ? 'Modal awal belum diisi. Masukkan nominal kas awal sebelum masuk ke kasir.'
        : 'Nominal kas awal tidak valid. Masukkan nominal yang lebih kecil.')
      const input = event.currentTarget.elements.namedItem('openingCash')
      if (input instanceof HTMLInputElement) input.focus()
      return
    }

    onStartShift({
      cashierName: cashierName.trim(),
      shiftTime: '',
      openingCash: amount,
      note: note.trim(),
    })
  }

  function handleOpeningCashChange(value: string) {
    setOpeningCash(value.replace(/\D/g, ''))
    setOpeningCashError('')
  }

  return (
    <main className="start-shift-page min-h-screen grid place-items-center bg-slate-100 p-5 text-slate-900">
      <section className="start-shift-card w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/10">
        <div className="shift-brand mb-6 flex items-center gap-3 [&_span]:grid [&_span]:h-12 [&_span]:w-12 [&_span]:place-items-center [&_span]:rounded-lg [&_span]:bg-teal-300 [&_span]:font-black [&_span]:text-teal-950 [&_strong]:block [&_small]:block [&_small]:text-slate-500">
          <span>PL</span>
          <div>
            <strong>POS Lagi</strong>
            <small>Start Shift</small>
          </div>
        </div>

        <div className="shift-heading mb-5 [&_p]:mb-2 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h1]:m-0 [&_h1]:text-3xl [&_h1]:font-black [&_span]:mt-2 [&_span]:block [&_span]:text-slate-500">
          <p>Shift Kasir</p>
          <h1>Mulai shift sebelum transaksi</h1>
          <span>Isi data kas awal agar operasional kasir hari ini tercatat rapi.</span>
          <span>Shift otomatis berakhir pukul 00.00 mengikuti waktu perangkat.</span>
        </div>

        <form className="shift-form grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-600" onSubmit={handleSubmit}>
          <label>
            Nama Kasir
            <Input
              value={cashierName}
              onChange={(event) => setCashierName(event.target.value)}
              placeholder="Nama kasir"
            />
          </label>

          <label>
            Kas Awal (wajib diisi)
            <Input
              name="openingCash"
              inputMode="numeric"
              aria-required="true"
              aria-invalid={Boolean(openingCashError)}
              aria-describedby={openingCashError ? 'opening-cash-error' : undefined}
              className={openingCashError ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}
              value={formatRupiah(openingCash)}
              onChange={(event) => handleOpeningCashChange(event.target.value)}
              placeholder="Contoh: Rp 500.000"
            />
            {openingCashError && (
              <span id="opening-cash-error" role="alert" className="text-sm font-medium text-red-600">
                {openingCashError}
              </span>
            )}
          </label>

          <label>
            Catatan
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Opsional, contoh: uang receh sudah lengkap"
            />
          </label>

          <div className="shift-actions flex flex-wrap gap-2">
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
