import { Button } from '../../../component/button/Button'
import { PageHeader } from '../../../component/header/PageHeader'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'
import './TransactionDetailPage.css'

type TransactionDetailPageProps = {
  transaction: TransactionRecord
  onBack: () => void
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onProfile: () => void
  profileName?: string
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function TransactionDetailPage({
  transaction,
  onBack,
  onDashboard,
  onProduct,
  onTransaction,
  onProfile,
  profileName,
}: TransactionDetailPageProps) {
  const transactionDate = new Date(transaction.createdAt)

  function handlePrint() {
    window.print()
  }

  return (
    <main className="transaction-detail-page">
      <Sidebar
        activePage="dashboard"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={() => undefined}
        onProfile={onProfile}
        profileName={profileName}
      />

      <section className="transaction-detail-content">
        <PageHeader
          eyebrow="Rincian Transaksi"
          title={transaction.id}
          description="Informasi lengkap transaksi dan product yang dibeli."
          actions={(
            <>
              <Button type="button" onClick={onBack}>Kembali</Button>
              <Button variant="primary" type="button" onClick={handlePrint}>Print Transaksi</Button>
            </>
          )}
        />

        <section className="transaction-detail-summary" aria-label="Informasi transaksi">
          <article>
            <span>Tanggal dan Waktu</span>
            <strong>{transactionDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
            <small>{transactionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
          </article>
          <article>
            <span>Kasir</span>
            <strong>{transaction.cashier}</strong>
            <small>{transaction.itemCount} item terjual</small>
          </article>
          <article>
            <span>Pembayaran</span>
            <strong>{transaction.paymentMethod}</strong>
            <small className="transaction-status">{transaction.status}</small>
          </article>
        </section>

        <section className="transaction-detail-layout">
          <article className="transaction-detail-panel">
            <header>
              <div>
                <p>Item Transaksi</p>
                <h2>Product yang dibeli</h2>
              </div>
              <strong>{transaction.items.length} product</strong>
            </header>

            <div className="transaction-item-list">
              {transaction.items.map((item, index) => (
                <div className="transaction-detail-item" key={item.productId}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{formatCurrency(item.price)} per item</small>
                  </div>
                  <span>{item.quantity}x</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))}
            </div>
          </article>

          <aside className="transaction-payment-panel">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(transaction.subtotal)}</strong>
            </div>
            <div className="transaction-payment-total">
              <span>Total</span>
              <strong>{formatCurrency(transaction.grandTotal)}</strong>
            </div>
            <div>
              <span>Dibayar</span>
              <strong>{formatCurrency(transaction.paid)}</strong>
            </div>
            <div>
              <span>Kembalian</span>
              <strong>{formatCurrency(transaction.change)}</strong>
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}
