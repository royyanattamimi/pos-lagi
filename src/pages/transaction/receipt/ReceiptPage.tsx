import { Sidebar } from '../../../component/sidebar/Sidebar'
import { PageHeader } from '../../../component/header/PageHeader'
import { Button } from '../../../component/button/Button'
import type { TransactionRecord } from '../../../types'

type ReceiptPageProps = {
  transaction: TransactionRecord
  onNewTransaction: () => void
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function ReceiptPage({
  transaction,
  onNewTransaction,
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
}: ReceiptPageProps) {
  const totalItems = transaction.items.reduce((total, item) => total + item.quantity, 0)

  function handlePrint() {
    window.print()
  }

  return (
    <main className="receipt-page app-shell">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="receipt-content content-shell">
        <PageHeader
          eyebrow="Receipt"
          title="Transaksi selesai"
          description="Struk pembayaran berhasil dibuat dan siap diperiksa."
          actions={(
            <div className="receipt-header-actions flex flex-wrap gap-2">
            <Button type="button" onClick={handlePrint}>Print Receipt</Button>
              <Button variant="primary" type="button" onClick={onNewTransaction}>Transaksi Baru</Button>
            </div>
          )}
        />

        <section className="receipt-layout grid items-start gap-5 xl:grid-cols-[minmax(340px,0.7fr)_minmax(300px,0.3fr)]">
          <article className="receipt-card rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
            <div className="receipt-store border-b border-dashed border-slate-300 pb-4 text-center [&_h2]:m-0 [&_h2]:text-2xl [&_h2]:font-black [&_p]:m-1 [&_p]:text-sm [&_p]:text-slate-500">
              <span>PL</span>
              <div>
                <strong>POS Lagi</strong>
                <small>Cabang Utama</small>
              </div>
            </div>

            <div className="receipt-meta my-4 grid gap-2 [&_span]:flex [&_span]:justify-between [&_span]:text-sm [&_strong]:text-slate-950">
              <span>No. Receipt <strong>{transaction.id}</strong></span>
              <span>Kasir <strong>{transaction.cashier}</strong></span>
              <span>Metode <strong>{transaction.paymentMethod}</strong></span>
            </div>

            <div className="receipt-items grid gap-3 border-y border-dashed border-slate-300 py-4">
              {transaction.items.map((item) => (
                <div className="receipt-item grid grid-cols-[1fr_auto] gap-2 text-sm block text-slate-500" key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  </div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>

            <div className="receipt-total my-4 grid gap-2 [&_span]:flex [&_span]:justify-between [&_span]:text-sm [&_strong]:text-slate-950">
              <span>Subtotal <strong>{formatCurrency(transaction.subtotal)}</strong></span>
              <span>Total <strong>{formatCurrency(transaction.grandTotal)}</strong></span>
              <span>Dibayar <strong>{transaction.paymentMethod === 'Cash' ? formatCurrency(transaction.paid) : transaction.paymentMethod}</strong></span>
              <span>Kembalian <strong>{formatCurrency(transaction.change)}</strong></span>
            </div>

            <footer className="receipt-footer border-t border-dashed border-slate-300 pt-4 text-center text-sm font-bold text-slate-500">
              <strong>Terima kasih</strong>
              <span>Barang yang sudah dibeli dapat ditukar sesuai kebijakan toko.</span>
              <small>www.poslagi.local</small>
            </footer>
          </article>

          <aside className="receipt-summary surface-panel [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black [&_p]:text-slate-500">
            <article>
              <span>Total Item</span>
              <strong>{totalItems}</strong>
            </article>
            <article>
              <span>Total Bayar</span>
              <strong>{formatCurrency(transaction.grandTotal)}</strong>
            </article>
            <article>
              <span>Status</span>
              <strong>Lunas</strong>
            </article>
            <Button variant="primary" type="button" onClick={onDashboard}>Kembali ke Dashboard</Button>
          </aside>
        </section>
      </section>
    </main>
  )
}
