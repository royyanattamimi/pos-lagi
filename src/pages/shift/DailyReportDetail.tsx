import { Printer } from 'lucide-react'
import { Button } from '../../component/button/Button'
import { PaymentBreakdown } from './PaymentBreakdown'
import type { buildDailyReports } from '../../storage/dailyReport'

type Props = {
  day: ReturnType<typeof buildDailyReports>[number]
  onSelectShift: (id: string) => void
}

export function DailyReportDetail({ day, onSelectShift }: Props) {
  const date = new Date(`${day.date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return (
    <>
      <article className="shift-report-paper rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <header className="mb-6 border-b border-slate-200 pb-5">
          <p className="text-sm font-bold text-teal-700">POS Lagi · Pendapatan harian</p>
          <h1 className="mt-1 text-2xl font-black">Rincian laporan harian</h1>
          <p className="mt-2 font-bold">{date}</p>
          <p className="mt-1 text-sm text-slate-500">Seluruh transaksi lunas pada tanggal ini, termasuk shift yang masih berjalan.</p>
        </header>
        <PaymentBreakdown key={day.date} records={day.records} />
        <section className="mt-6 border-t border-slate-200 pt-5">
          <h2 className="mb-3 font-bold">Shift dan catatan pada hari ini</h2>
          <div className="grid gap-3">
            {day.shifts.map((shift) => <div key={shift.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <strong className="block">{shift.cashierName || 'Kasir'} · {shift.id}</strong>
              <p className="text-slate-500">{new Date(shift.startAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {shift.status}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">Catatan penutupan: {shift.report?.closingNote || 'Belum ada catatan penutupan.'}</p>
              {shift.status === 'Selesai' && <Button size="small" className="shift-report-controls mt-3" onClick={() => onSelectShift(shift.id)}>Lihat laporan & selisih kas shift</Button>}
            </div>)}
            {!day.shifts.length && <p className="text-sm text-slate-500">Tidak ada data shift tersimpan pada tanggal ini.</p>}
          </div>
        </section>
      </article>
      <div className="shift-report-controls mt-5">
        <Button onClick={() => window.print()}><Printer /> Cetak / Simpan PDF</Button>
        <p className="mt-2 text-sm text-slate-500">Cetakan memuat ringkasan semua metode dan detail transaksi sesuai metode yang sedang dipilih.</p>
      </div>
    </>
  )
}
