import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'
import './ReceiptPage.css'

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
    <main className="receipt-page">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="receipt-content">
        <header className="receipt-header">
          <div>
            <p>Receipt</p>
            <h1>Transaksi selesai</h1>
            <span>Struk pembayaran berhasil dibuat dan siap diperiksa.</span>
          </div>
          <div className="receipt-header-actions">
            <button type="button" onClick={handlePrint}>Print Receipt</button>
            <button type="button" onClick={onNewTransaction}>Transaksi Baru</button>
          </div>
        </header>

        <section className="receipt-layout">
          <article className="receipt-card">
            <div className="receipt-store">
              <span>PL</span>
              <div>
                <strong>POS Lagi</strong>
                <small>Cabang Utama</small>
              </div>
            </div>

            <div className="receipt-meta">
              <span>No. Receipt <strong>{transaction.id}</strong></span>
              <span>Kasir <strong>{transaction.cashier}</strong></span>
              <span>Metode <strong>{transaction.paymentMethod}</strong></span>
            </div>

            <div className="receipt-items">
              {transaction.items.map((item) => (
                <div className="receipt-item" key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  </div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>

            <div className="receipt-total">
              <span>Subtotal <strong>{formatCurrency(transaction.subtotal)}</strong></span>
              <span>PPN 10% <strong>{formatCurrency(transaction.tax)}</strong></span>
              <span>Total <strong>{formatCurrency(transaction.grandTotal)}</strong></span>
              <span>Dibayar <strong>{transaction.paymentMethod === 'Cash' ? formatCurrency(transaction.paid) : transaction.paymentMethod}</strong></span>
              <span>Kembalian <strong>{formatCurrency(transaction.change)}</strong></span>
            </div>

            <footer className="receipt-footer">
              <strong>Terima kasih</strong>
              <span>Barang yang sudah dibeli dapat ditukar sesuai kebijakan toko.</span>
              <small>www.poslagi.local</small>
            </footer>
          </article>

          <aside className="receipt-summary">
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
            <button type="button" onClick={onDashboard}>Kembali ke Dashboard</button>
          </aside>
        </section>
      </section>
    </main>
  )
}
