import { useState } from 'react'
import { Button } from '../../../component/button/Button'
import { Input } from '../../../component/input/Input'
import { refundPreview, refundedQuantity } from '../../../storage/refund'
import type { RefundInput, ShiftSession, TransactionRecord } from '../../../types'

const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

type Props = {
  transaction: TransactionRecord
  refunds: TransactionRecord[]
  currentShift: ShiftSession | null
  onRefund: (input: RefundInput) => Promise<void>
  available: boolean
}

export function RefundPanel({ transaction, refunds, currentShift, onRefund, available }: Props) {
  const [open, setOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [method, setMethod] = useState(transaction.paymentMethod)
  const [reference, setReference] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<RefundInput | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const refunded = -refunds.reduce((sum, record) => sum + record.grandTotal, 0)
  const remaining = transaction.items.some((item) => item.itemId && refundedQuantity(item, refunds) < item.quantity)
  const canRefund = available && currentShift?.status === 'Berjalan' && remaining && transaction.grandTotal > refunded
  let amount = 0
  let validation = ''
  try { amount = refundPreview(transaction, refunds, quantities) }
  catch (failure) { validation = failure instanceof Error ? failure.message : 'Jumlah tidak valid.' }

  async function submit() {
    if (saving || !currentShift) return
    if (!pending && (!canRefund || validation || amount <= 0 || !reason.trim() || !confirmed || (method !== 'Cash' && !reference.trim()))) {
      setError(validation || 'Pilih produk, isi alasan dan referensi non-tunai, lalu konfirmasi pengembalian uang.')
      return
    }
    const input = pending ?? {
      id: crypto.randomUUID(), transactionId: transaction.id, shiftId: currentShift.id,
      reason: reason.trim(), paymentMethod: method, reference: reference.trim(),
      items: Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([itemId, quantity]) => ({ itemId, quantity })),
    }
    setPending(input)
    setSaving(true)
    setError('')
    try {
      await onRefund(input)
      setPending(null)
      setQuantities({})
      setReason('')
      setReference('')
      setConfirmed(false)
      setOpen(false)
      setMessage('Refund berhasil dicatat di database.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Refund belum tersimpan. Coba lagi.')
    } finally { setSaving(false) }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">Refund produk</h2><p className="text-sm text-slate-500">Refund tercatat: {money(refunded)} · Sisa pembayaran: {money(transaction.grandTotal - refunded)}</p></div>
        {!open && <Button variant="danger" disabled={!canRefund} onClick={() => { setOpen(true); setMessage('') }}>Refund produk</Button>}
      </div>
      {!available && <p role="status" className="mb-3 text-sm text-amber-700">Fitur refund belum diaktifkan. Pengelola aplikasi perlu mengaktifkan penyimpanan refund di database terlebih dahulu.</p>}
      {!remaining && <p className="text-sm text-slate-500">{transaction.items.some((item) => !item.itemId) ? 'Muat ulang transaksi untuk mendapatkan rincian barang dari database.' : 'Seluruh produk sudah direfund.'}</p>}
      {currentShift?.status !== 'Berjalan' && <p className="text-sm text-slate-500">Mulai shift untuk mencatat pengembalian uang.</p>}
      {message && <p role="status" className="mb-3 text-sm text-teal-700">{message}</p>}
      {open && <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="mb-5 grid gap-4">
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Ini pencatatan refund manual. Kembalikan uang melalui kas atau penyedia pembayaran terlebih dahulu. Aplikasi tidak mengirim uang otomatis. Pengeluaran dicatat pada shift dan tanggal refund.</p>
        <fieldset disabled={saving || Boolean(pending)} className="grid gap-4 disabled:opacity-70">
          <div className="grid gap-3">
            {transaction.items.map((item, index) => {
              const available = item.quantity - refundedQuantity(item, refunds)
              return <label key={item.itemId ?? index} className="grid items-center gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_120px]">
                <span><strong className="block">{item.name}</strong><small>Dibeli {item.quantity} · Sudah refund {item.quantity - available} · Sisa {available}</small></span>
                <Input aria-label={`Jumlah refund ${item.name}`} type="number" min="0" max={available} step="1" disabled={!item.itemId || available === 0} value={item.itemId ? quantities[item.itemId] ?? 0 : 0} onChange={(event) => { if (item.itemId) setQuantities({ ...quantities, [item.itemId]: Number(event.target.value) }) }} />
              </label>
            })}
          </div>
          <Button onClick={() => setQuantities(Object.fromEntries(transaction.items.filter((item) => item.itemId).map((item) => [item.itemId!, item.quantity - refundedQuantity(item, refunds)])))}>Pilih semua sisa produk</Button>
          <label className="grid gap-2 text-sm font-bold">Alasan refund<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: produk rusak atau pesanan tidak sesuai" /></label>
          <label className="grid gap-2 text-sm font-bold">Metode pengembalian uang
            <select className="min-h-10 rounded-lg border border-slate-200 p-2" value={method} onChange={(event) => setMethod(event.target.value)}>{['Cash', 'QRIS', 'Debit'].map((name) => <option key={name}>{name}</option>)}</select>
          </label>
          <label className="grid gap-2 text-sm font-bold">Referensi pengembalian {method === 'Cash' ? '(opsional)' : '(wajib)'}<Input required={method !== 'Cash'} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Nomor referensi pengembalian uang" /></label>
          <div className="rounded-lg bg-slate-50 p-4"><span className="text-sm">Total refund termasuk penyesuaian pajak/diskon</span><strong className="block text-xl">{money(amount)}</strong></div>
          {validation && <p role="alert" className="text-sm text-red-600">{validation}</p>}
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Saya sudah mengembalikan uang sesuai nominal dan metode di atas.</label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {pending && !saving && <p className="text-sm text-slate-500">Jangan kembalikan uang lagi. Coba simpan ulang dengan nomor refund yang sama. Jika ditolak karena data berubah, muat ulang untuk memeriksa riwayat refund.</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" type="submit" disabled={saving || (!pending && (amount <= 0 || Boolean(validation) || !confirmed))}>{saving ? 'Menyimpan…' : pending ? 'Coba simpan refund lagi' : 'Simpan refund'}</Button>
          {!pending && <Button onClick={() => setOpen(false)}>Batal</Button>}
          {pending && !saving && <Button onClick={() => window.location.reload()}>Muat ulang riwayat</Button>}
        </div>
      </form>}
      <div className="grid gap-3">
        {refunds.map((refund) => <article key={refund.id} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
          <strong className="block">{refund.id} · {money(-refund.grandTotal)}</strong>
          <p>{new Date(refund.createdAt).toLocaleString('id-ID')} · {refund.cashier} · {refund.paymentMethod}</p>
          <p className="whitespace-pre-wrap break-words">Alasan: {refund.refundReason}</p>
          {refund.refundReference && <p className="break-words">Referensi: {refund.refundReference}</p>}
          <ul className="mt-2 list-inside list-disc">{refund.items.map((item) => <li key={item.itemId}>{item.name} × {item.quantity}</li>)}</ul>
        </article>)}
      </div>
    </section>
  )
}
