import { useState } from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { buildDailyReports, reportDateKey } from '../../storage/dailyReport'
import { DailyReportDetail } from './DailyReportDetail'
import { PaymentBreakdown } from './PaymentBreakdown'
import { summarizeShift } from '../../storage/shiftReport'
import type { ShiftSession, TransactionRecord } from '../../types'

const money = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value)
const dateTime = (value: string) => new Date(value).toLocaleString('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
type Props = {
  shifts: ShiftSession[]
  transactions: TransactionRecord[]
  closingShift: ShiftSession | null
  initialShiftId?: string
  onBack: () => void
  onFinish?: () => void
  onSave: (shift: ShiftSession, cash: number, note: string) => Promise<void>
}

export function ShiftReportPage({ shifts, transactions, closingShift, initialShiftId, onBack, onFinish, onSave }: Props) {
  const [selectedId, setSelectedId] = useState(initialShiftId ?? '')
  const [date, setDate] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const days = buildDailyReports(shifts, transactions)
  const day = days.find((entry) => entry.date === selectedDay)
  const history = shifts.filter((shift) => shift.status === 'Selesai')
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
  const selected = closingShift ?? history.find((shift) => shift.id === selectedId)
  return (
    <main className="shift-report-page min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="shift-report-controls mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={onBack}><ArrowLeft /> Kembali</Button>
          {(selected || day) && !closingShift && <Button onClick={() => { setSelectedId(''); setSelectedDay('') }}>Semua laporan</Button>}
          {selected && !closingShift && <Button onClick={() => { setSelectedDay(reportDateKey(selected.startAt)); setSelectedId('') }}>Lihat pendapatan tanggal ini</Button>}
        </div>
        {selected ? (
          <ReportDetail key={`${selected.id}-${selected.status}`} shift={selected} transactions={transactions} onSave={onSave} onFinish={onFinish} />
        ) : day ? (
          <DailyReportDetail day={day} onSelectShift={setSelectedId} />
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-black">Riwayat laporan harian & shift</h1>
            <p className="mt-2 text-sm text-slate-500">Klik tanggal untuk mencocokkan pendapatan Cash, QRIS, Debit, dan detail transaksi hari itu. Laporan penutupan setiap shift tersedia di dalamnya.</p>
            <p className="mt-1 text-sm text-slate-500">Laporan tersimpan di database akun Anda. Gunakan Cetak / Simpan PDF untuk menyimpan salinan file.</p>
            <label className="my-5 block max-w-xs text-sm font-bold">Tanggal laporan
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <div className="grid gap-3">
              {days.filter((entry) => !date || entry.date === date).map((entry) => (
                <Button key={entry.date} className="w-full flex-col items-stretch gap-3 p-4 text-left" onClick={() => setSelectedDay(entry.date)}>
                  <span className="flex flex-wrap justify-between gap-2">
                    <strong>{new Date(`${entry.date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    <strong>{money(entry.total)}</strong>
                  </span>
                  <span className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                    {entry.payments.map(([method, payment]) => <span key={method}>{method}: {money(payment.total)}</span>)}
                  </span>
                  <span className="text-xs text-teal-700">{entry.records.length} transaksi · {entry.shifts.length} shift · Lihat rincian harian</span>
                </Button>
              ))}
              {!days.some((entry) => !date || entry.date === date) && <p className="py-8 text-center text-slate-500">Belum ada laporan{date ? ' pada tanggal ini' : ''}.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function ReportDetail({ shift, transactions, onSave, onFinish }: {
  shift: ShiftSession; transactions: TransactionRecord[]; onSave: Props['onSave']; onFinish: Props['onFinish']
}) {
  const [cash, setCash] = useState(shift.report?.closingCash?.toString() ?? '')
  const [note, setNote] = useState(shift.report?.closingNote ?? '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const summary = summarizeShift(shift, transactions)
  const isClosing = shift.status === 'Berjalan'
  const dirty = cash !== (shift.report?.closingCash?.toString() ?? '') || note !== (shift.report?.closingNote ?? '')
  const difference = shift.report?.closingCash == null ? null : shift.report.closingCash - summary.expectedCash

  async function save() {
    if (saving) return
    setMessage('')
    const amount = Number(cash)
    if (!cash.trim() || !Number.isSafeInteger(amount) || amount < 0) {
      setError('Isi kas fisik dengan nominal rupiah bulat, minimal 0.')
      return
    }
    setSaving(true)
    try {
      await onSave(shift, amount, note.trim())
      setNote(note.trim())
      setCash(String(amount))
      setError('')
      setMessage('Laporan berhasil disimpan.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Laporan gagal disimpan. Silakan coba lagi.')
    } finally { setSaving(false) }
  }

  return (
    <>
      <article className="shift-report-paper rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <header className="mb-6 border-b border-slate-200 pb-5">
          <p className="text-sm font-bold text-teal-700">POS Lagi · {isClosing ? 'Preview penutupan' : 'Laporan akhir'}</p>
          <h1 className="mt-1 text-2xl font-black">Laporan penutupan shift</h1>
          <p className="mt-2 text-sm">{shift.id} · Kasir: {shift.cashierName || '—'}</p>
          <p className="text-sm">Mulai: {dateTime(shift.startAt)}</p>
          <p className="text-sm">Selesai: {shift.endAt ? dateTime(shift.endAt) : 'Shift masih berjalan'}</p>
        </header>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Total penjualan', money(summary.sales)], ['Transaksi lunas', summary.records.length],
            ['Item terjual', summary.items], ['Kas seharusnya', money(summary.expectedCash)],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-sm text-slate-500">{label}</p><strong className="text-lg">{value}</strong></div>)}
        </div>
        <dl className="mb-6 grid grid-cols-2 gap-2 text-sm">
          <dt>Kas awal</dt><dd className="text-right">{money(shift.openingCash)}</dd>
          <dt>Penjualan tunai (setelah kembalian)</dt><dd className="text-right">{money(summary.cashSales)}</dd>
          <dt>Kas seharusnya</dt><dd className="text-right font-bold">{money(summary.expectedCash)}</dd>
          <dt>Kas fisik saat ditutup</dt><dd className="text-right">{shift.report?.closingCash == null ? 'Belum dicatat' : money(shift.report.closingCash)}</dd>
          <dt>Selisih kas fisik − kas seharusnya</dt><dd className="text-right font-bold">{difference === null ? 'Belum dicatat' : `${money(difference)} (${difference === 0 ? 'Sesuai' : difference > 0 ? 'Lebih' : 'Kurang'})`}</dd>
        </dl>
        <section className="mb-5"><h2 className="font-bold">Catatan awal shift</h2><p className="whitespace-pre-wrap break-words text-sm">{shift.note || 'Tidak ada catatan.'}</p></section>
        <section className="mb-5"><h2 className="font-bold">Catatan penutupan</h2><p className="whitespace-pre-wrap break-words text-sm">{shift.report?.closingNote || 'Belum ada catatan penutupan.'}</p></section>
        <PaymentBreakdown records={summary.records} />
        {shift.report && <p className="mt-6 text-xs text-slate-500">Terakhir disimpan: {dateTime(shift.report.savedAt)}</p>}
      </article>
      <form className="shift-report-controls mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-6" onSubmit={(event) => { event.preventDefault(); save() }}>
        <h2 className="font-bold">{isClosing ? 'Lengkapi penutupan shift' : 'Catatan dan kas fisik laporan'}</h2>
        <label className="grid gap-2 text-sm font-bold">Kas fisik akhir (Rp)
          <Input
            type="text"
            inputMode="numeric"
            required
            value={cash ? money(Number(cash)) : ''}
            onChange={(event) => setCash(event.target.value.replace(/\D/g, ''))}
            placeholder="Contoh: Rp 500.000"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">Catatan penutupan
          <textarea className="min-h-28 rounded-lg border border-slate-200 p-3 font-normal" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: alasan selisih kas atau pesan untuk shift berikutnya" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="text-sm text-teal-700">{message}</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant={isClosing ? 'danger' : 'primary'} type="submit" disabled={saving}>{saving ? 'Menyimpan…' : isClosing ? 'Simpan laporan & tutup shift' : 'Simpan perubahan'}</Button>
          {!isClosing && <Button disabled={dirty || saving} onClick={() => window.print()}><Printer /> Cetak / Simpan PDF</Button>}
          {!isClosing && onFinish && <Button variant="primary" disabled={dirty || saving} onClick={onFinish}>Selesai</Button>}
        </div>
        {!isClosing && dirty && <p className="text-sm text-slate-500">Simpan perubahan sebelum mencetak laporan atau menyelesaikan laporan.</p>}
      </form>
    </>
  )
}
