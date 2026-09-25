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
  cashAvailable: number
  onRefund: (input: RefundInput) => Promise<void>
  available: boolean
}

export function RefundPanel({ transaction, refunds, currentShift, cashAvailable, onRefund, available }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
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
  const insufficientCash = amount > cashAvailable
  const selectedItems = transaction.items.filter((item) => item.itemId && (quantities[item.itemId] ?? 0) > 0)

  function review() {
    if (!canRefund || validation || amount <= 0 || !reason.trim() || insufficientCash) {
      setError(validation || (insufficientCash ? 'Kas shift menurut sistem belum cukup untuk mengembalikan uang tunai.' : 'Pilih produk dan isi alasan refund.'))
      return
    }
    setConfirmed(false)
    setError('')
    setStep('review')
  }

  async function submit() {
    if (saving || !currentShift) return
    if (!pending && (!canRefund || validation || amount <= 0 || !reason.trim() || !confirmed || insufficientCash)) {
      setError(validation || 'Periksa nominal, kecukupan kas, dan konfirmasi penyerahan uang tunai.')
      return
    }
    const input = pending ?? {
      id: crypto.randomUUID(), transactionId: transaction.id, shiftId: currentShift.id,
      reason: reason.trim(), paymentMethod: 'Cash', reference: reference.trim(),
      expectedAmount: amount, cashConfirmed: true,
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
      setStep('select')
      setOpen(false)
      setMessage(`Refund tunai ${money(input.expectedAmount)} berhasil dicatat. Kas shift berkurang sebesar nominal tersebut; rinciannya masuk ke laporan akhir shift.`)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Refund belum tersimpan. Coba lagi.')
    } finally { setSaving(false) }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">Refund tunai</h2><p className="text-sm text-slate-500">Refund tercatat: {money(refunded)} · Sisa pembayaran: {money(transaction.grandTotal - refunded)}</p></div>
        {!open && <Button variant="danger" disabled={!canRefund} onClick={() => { setOpen(true); setStep('select'); setMessage(''); setError('') }}>Refund produk</Button>}
      </div>
      {!available && <p role="status" className="mb-3 text-sm text-amber-700">Fitur refund belum diaktifkan. Pengelola aplikasi perlu mengaktifkan penyimpanan refund di database terlebih dahulu.</p>}
      {!remaining && <p className="text-sm text-slate-500">{transaction.items.some((item) => !item.itemId) ? 'Muat ulang transaksi untuk mendapatkan rincian barang dari database.' : 'Seluruh produk sudah direfund.'}</p>}
      {currentShift?.status !== 'Berjalan' && <p className="text-sm text-slate-500">Mulai shift untuk mencatat pengembalian uang.</p>}
      {message && <p role="status" className="mb-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
      {open && <form onSubmit={(event) => { event.preventDefault(); if (step === 'select') review(); else void submit() }} className="mb-5 grid gap-4">
        <ol className="flex flex-wrap gap-4 text-sm" aria-label="Tahap refund">
          <li aria-current={step === 'select' ? 'step' : undefined} className={step === 'select' ? 'font-bold text-teal-700' : 'text-slate-500'}>1. Pilih barang & alasan</li>
          <li aria-current={step === 'review' ? 'step' : undefined} className={step === 'review' ? 'font-bold text-teal-700' : 'text-slate-500'}>2. Periksa & serahkan uang tunai</li>
          <li className="text-slate-500">3. Simpan bukti refund</li>
        </ol>
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Pembayaran nota asal: <strong>{transaction.paymentMethod}</strong>. Refund ini dikembalikan sebagai <strong>uang tunai dari kas shift saat ini</strong>. Untuk nota QRIS/Debit, penerimaan aslinya tetap tercatat pada metode tersebut; uang refund keluar dari Cash.</p>
        {step === 'select' ? <fieldset disabled={saving} className="grid gap-4">
          <div className="grid gap-3">
            {transaction.items.map((item, index) => {
              const availableQuantity = item.quantity - refundedQuantity(item, refunds)
              return <label key={item.itemId ?? index} className="grid items-center gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_120px]">
                <span><strong className="block">{item.name}</strong><small>Dibeli {item.quantity} · Sudah refund {item.quantity - availableQuantity} · Sisa {availableQuantity}</small></span>
                <Input aria-label={`Jumlah refund ${item.name}`} type="number" min="0" max={availableQuantity} step="1" disabled={!item.itemId || availableQuantity === 0} value={item.itemId ? quantities[item.itemId] ?? 0 : 0} onChange={(event) => { if (item.itemId) setQuantities({ ...quantities, [item.itemId]: Number(event.target.value) }) }} />
              </label>
            })}
          </div>
          <Button onClick={() => setQuantities(Object.fromEntries(transaction.items.filter((item) => item.itemId).map((item) => [item.itemId!, item.quantity - refundedQuantity(item, refunds)])))}>Pilih semua sisa produk</Button>
          <label className="grid gap-2 text-sm font-bold">Alasan refund<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Contoh: produk rusak atau pesanan tidak sesuai" /></label>
          <label className="grid gap-2 text-sm font-bold">Catatan penyerahan / penerima (opsional)<Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Contoh: diterima pelanggan Budi" /></label>
        </fieldset> : <div className="rounded-lg border border-slate-200 p-4 text-sm">
          <h3 className="mb-2 font-bold">Periksa rincian refund</h3>
          <p>Nota: {transaction.id}</p><p>Kasir: {currentShift?.cashierName || '-'}</p>
          <ul className="my-3 list-inside list-disc">{selectedItems.map((item) => <li key={item.itemId}>{item.name} × {quantities[item.itemId!]}</li>)}</ul>
          <p className="whitespace-pre-wrap break-words">Alasan: {reason}</p>
          {reference && <p className="mt-1 break-words">Catatan penyerahan: {reference}</p>}
        </div>}
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <dt>Kas shift menurut sistem sebelum refund</dt><dd className="text-right font-bold">{money(cashAvailable)}</dd>
          <dt>Uang tunai untuk pelanggan</dt><dd className="text-right text-lg font-bold text-red-700">− {money(amount)}</dd>
          <dt>Kas seharusnya setelah refund</dt><dd className="text-right text-lg font-bold">{money(cashAvailable - amount)}</dd>
        </dl>
        <p className="text-xs text-slate-500">Nominal refund sudah memperhitungkan pajak/diskon secara proporsional. Pastikan uang fisik di laci sesuai sebelum penyerahan.</p>
        {(validation || insufficientCash) && <p role="alert" className="text-sm text-red-600">{validation || 'Kas menurut sistem tidak cukup. Selesaikan pencocokan kas dengan penanggung jawab sebelum menyerahkan uang.'}</p>}
        {step === 'review' && <label className="flex items-start gap-2 rounded-lg border border-teal-200 p-3 text-sm"><input type="checkbox" required disabled={saving || Boolean(pending)} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Saya sudah menyerahkan uang tunai {money(amount)} kepada pelanggan dari kas shift ini.</label>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {pending && !saving && <p className="text-sm text-slate-500">Jangan serahkan uang lagi. Coba simpan ulang dengan nomor refund yang sama. Jika data berubah, muat ulang untuk memeriksa riwayat dan cocokkan uang yang sudah diserahkan.</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant={step === 'review' ? 'danger' : 'primary'} type="submit" disabled={saving || (!pending && (amount <= 0 || Boolean(validation) || insufficientCash || (step === 'review' && !confirmed)))}>{saving ? 'Menyimpan…' : pending ? 'Coba simpan refund lagi' : step === 'select' ? 'Lanjut: periksa refund' : 'Simpan refund & kas keluar'}</Button>
          {!pending && step === 'review' && <Button onClick={() => { setStep('select'); setConfirmed(false); setError('') }}>Ubah pilihan</Button>}
          {!pending && <Button onClick={() => { setOpen(false); setConfirmed(false) }}>Batal</Button>}
          {pending && !saving && <Button onClick={() => window.location.reload()}>Muat ulang riwayat</Button>}
        </div>
      </form>}
      <div className="grid gap-3">
        {refunds.map((refund) => <article key={refund.id} className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm">
          <strong className="block">{refund.id} · {money(-refund.grandTotal)}</strong>
          <p>{new Date(refund.createdAt).toLocaleString('id-ID')} · Kasir {refund.cashier}</p>
          <p>Pembayaran asal: {refund.originalPaymentMethod || transaction.paymentMethod} → Pengembalian: {refund.paymentMethod}</p>
          <p className="whitespace-pre-wrap break-words">Alasan: {refund.refundReason}</p>
          {refund.refundReference && <p className="break-words">Catatan penyerahan / referensi: {refund.refundReference}</p>}
          {refund.refundCashBefore != null && refund.refundCashAfter != null && <p className="mt-2 font-bold">Kas: {money(refund.refundCashBefore)} − {money(-refund.grandTotal)} = {money(refund.refundCashAfter)}</p>}
          <ul className="mt-2 list-inside list-disc">{refund.items.map((item) => <li key={item.itemId}>{item.name} × {item.quantity}</li>)}</ul>
        </article>)}
      </div>
    </section>
  )
}
