import { useState } from 'react'
import { Button } from '../../component/button/Button'
import { summarizePayments } from '../../storage/dailyReport'
import type { TransactionRecord } from '../../types'

const money = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value)

export function PaymentBreakdown({ records }: { records: TransactionRecord[] }) {
  const [method, setMethod] = useState('Semua')
  const summary = summarizePayments(records)
  const filtered = method === 'Semua' ? records : records.filter((record) => record.paymentMethod === method)
  const filteredTotal = filtered.reduce((total, record) => total + record.grandTotal, 0)
  return (
    <section>
      <h2 className="mb-2 font-bold">Rincian pendapatan</h2>
      <p className="mb-3 text-sm text-slate-500">Pendapatan dihitung dari total transaksi lunas. Kas awal tidak termasuk pendapatan; penjualan Cash sudah memperhitungkan kembalian.</p>
      <div className="shift-report-controls mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Semua', { count: records.length, total: summary.total }] as const, ...summary.payments].map(([name, payment]) => (
          <Button key={name} aria-pressed={method === name} variant={method === name ? 'primary' : 'secondary'} className="h-auto flex-col items-start p-4 text-left" onClick={() => setMethod(name)}>
            <span>{name === 'Semua' ? 'Semua pembayaran' : name}</span>
            <strong className="text-lg">{money(payment.total)}</strong>
            <small>{payment.count} transaksi · Lihat detail</small>
          </Button>
        ))}
      </div>
      <table className="mb-5 w-full text-left text-sm">
        <caption className="sr-only">Total pendapatan menurut metode pembayaran</caption>
        <thead><tr className="border-b"><th className="py-2">Metode pembayaran</th><th>Transaksi</th><th className="text-right">Pendapatan</th></tr></thead>
        <tbody>{summary.payments.map(([name, payment]) => <tr key={name} className="border-b border-slate-100"><td className="py-2">{name}</td><td>{payment.count}</td><td className="text-right">{money(payment.total)}</td></tr>)}</tbody>
        <tfoot><tr className="font-bold"><td className="py-3">Total pendapatan</td><td>{records.length}</td><td className="text-right">{money(summary.total)}</td></tr></tfoot>
      </table>
      <div aria-live="polite" className="mb-3">
        <h3 className="font-bold">Detail transaksi · {method === 'Semua' ? 'Semua pembayaran' : method}</h3>
        <p className="text-sm text-slate-500">{filtered.length} transaksi · {money(filteredTotal)}</p>
      </div>
      <div className="grid gap-2">
        {filtered.map((record) => (
          <details key={record.id} className="payment-transaction rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm">
              <span className="font-bold">{record.id} · {money(record.grandTotal)}</span>
              <span className="ml-2 text-slate-500">{record.paymentMethod} · {new Date(record.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {record.cashier}</span>
              <span className="shift-report-controls ml-2 text-xs text-teal-700">Rincian belanja</span>
            </summary>
            <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
              {record.items.map((item, index) => <div key={`${item.productId}-${index}`} className="mb-2 flex justify-between gap-3"><span>{item.name} × {item.quantity}<small className="block text-slate-500">{money(item.price)} / item{item.note ? ` · ${item.note}` : ''}</small></span><strong>{money(item.total)}</strong></div>)}
              <dl className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3">
                <dt>Subtotal</dt><dd className="text-right">{money(record.subtotal)}</dd>
                <dt>Pajak</dt><dd className="text-right">{money(record.tax)}</dd>
                <dt>Total pendapatan</dt><dd className="text-right font-bold">{money(record.grandTotal)}</dd>
                <dt>Dibayar</dt><dd className="text-right">{money(record.paid)}</dd>
                <dt>Kembalian</dt><dd className="text-right">{money(record.change)}</dd>
              </dl>
            </div>
          </details>
        ))}
        {!filtered.length && <p className="py-4 text-sm text-slate-500">Tidak ada transaksi {method === 'Semua' ? '' : method} pada laporan ini.</p>}
      </div>
    </section>
  )
}
