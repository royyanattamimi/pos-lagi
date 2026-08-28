import { Sidebar } from '../../../component/sidebar/Sidebar'
import './ReceiptPage.css'

type ReceiptItem = {
  productId: number
  quantity: number
  product: {
    name: string
    price: number
  }
  total: number
}

type ReceiptPageProps = {
  items: ReceiptItem[]
  subtotal: number
  tax: number
  grandTotal: number
  paid: number
  change: number
  paymentMethod: string
  onNewTransaction: () => void
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  onLogout: () => void
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
  items,
  subtotal,
  tax,
  grandTotal,
  paid,
  change,
  paymentMethod,
  onNewTransaction,
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  onLogout,
}: ReceiptPageProps) {
  const receiptId = '#POS-1050'
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

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
        onLogout={onLogout}
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
              <span>No. Receipt <strong>{receiptId}</strong></span>
              <span>Kasir <strong>Admin Kasir</strong></span>
              <span>Metode <strong>{paymentMethod}</strong></span>
            </div>

            <div className="receipt-items">
              {items.map((item) => (
                <div className="receipt-item" key={item.productId}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.quantity} x {formatCurrency(item.product.price)}</span>
                  </div>
                  <b>{formatCurrency(item.total)}</b>
                </div>
              ))}
            </div>

            <div className="receipt-total">
              <span>Subtotal <strong>{formatCurrency(subtotal)}</strong></span>
              <span>PPN 10% <strong>{formatCurrency(tax)}</strong></span>
              <span>Total <strong>{formatCurrency(grandTotal)}</strong></span>
              <span>Dibayar <strong>{paymentMethod === 'Cash' ? formatCurrency(paid) : paymentMethod}</strong></span>
              <span>Kembalian <strong>{formatCurrency(change)}</strong></span>
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
              <strong>{formatCurrency(grandTotal)}</strong>
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
