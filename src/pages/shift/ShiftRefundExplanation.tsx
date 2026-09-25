import { summarizeShift } from '../../storage/shiftReport'
import type { ShiftSession, TransactionRecord } from '../../types'

const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export function ShiftRefundExplanation({ shift, transactions }: { shift: ShiftSession; transactions: TransactionRecord[] }) {
  const summary = summarizeShift(shift, transactions)
  return (
    <section className="shift-refund-explanation mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="mb-2 font-bold">Penjelasan refund pada shift ini</h2>
      {!summary.refunds.length ? <p className="text-sm">Tidak ada refund yang dicatat pada shift ini.</p> : <>
        <p className="text-sm leading-relaxed">Terdapat <strong>{summary.refunds.length} refund</strong> dengan total <strong>{money(summary.refundTotal)}</strong>. Uang tunai sebesar <strong>{money(summary.cashRefundTotal)}</strong> keluar dari kas untuk pengembalian kepada pelanggan dan sudah dikurangkan dari kas akhir menurut sistem.</p>
        {summary.refundTotal > summary.cashRefundTotal && <p className="mt-2 text-sm">Refund non-tunai dari riwayat sebelumnya sebesar {money(summary.refundTotal - summary.cashRefundTotal)} tidak mengurangi uang fisik di laci.</p>}
        <p className="my-3 rounded-lg bg-white p-3 text-sm font-bold">Kas awal {money(shift.openingCash)} + penjualan tunai {money(summary.cashGrossSales)} − refund tunai {money(summary.cashRefundTotal)} = kas seharusnya {money(summary.expectedCash)}.</p>
        <p className="mb-3 text-sm">Refund atas nota QRIS/Debit yang dikembalikan tunai tetap mengurangi Cash. Nota asli tetap tercatat; pengeluaran masuk pada shift saat uang dikembalikan. Kas fisik akhir diperoleh dari penghitungan uang di laci.</p>
        <div className="grid gap-3">
          {summary.refunds.map((refund) => <article key={refund.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><strong>{refund.id}</strong><strong>{money(-refund.grandTotal)}</strong></div>
            <p className="mt-1">Nota asal: {refund.originalTransactionId}</p>
            <p>{new Date(refund.createdAt).toLocaleString('id-ID')} · Kasir: {refund.cashier}</p>
            <p>Pembayaran asal: {refund.originalPaymentMethod || 'Lihat nota asal'} · Dikembalikan melalui: {refund.paymentMethod}</p>
            <p className="mt-2 whitespace-pre-wrap break-words"><strong>Alasan:</strong> {refund.refundReason || 'Tidak ada catatan.'}</p>
            {refund.refundReference && <p className="whitespace-pre-wrap break-words">Penyerahan / referensi: {refund.refundReference}</p>}
            <ul className="my-2 list-inside list-disc">{refund.items.map((item, index) => <li key={item.itemId ?? index}>{item.name} × {item.quantity}</li>)}</ul>
            {refund.refundCashBefore != null && refund.refundCashAfter != null && <p>Kas sebelum: {money(refund.refundCashBefore)} · Kas sesudah: {money(refund.refundCashAfter)}</p>}
          </article>)}
        </div>
      </>}
    </section>
  )
}
