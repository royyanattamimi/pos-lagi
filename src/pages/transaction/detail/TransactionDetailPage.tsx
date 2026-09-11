import { Button } from '../../../component/button/Button'
import { PageHeader } from '../../../component/header/PageHeader'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'

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
    <main className="transaction-detail-page min-h-screen grid grid-cols-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900 md:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar
        activePage="dashboard"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={() => undefined}
        onProfile={onProfile}
        profileName={profileName}
      />

      <section className="transaction-detail-content min-w-0 p-5 md:p-8">
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

        <section className="transaction-detail-summary mb-5 grid gap-3 md:grid-cols-3 [&_article]:rounded-lg [&_article]:border [&_article]:border-slate-200 [&_article]:bg-white [&_article]:p-4 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500 [&_strong]:block [&_strong]:text-lg [&_strong]:font-black [&_small]:text-sm [&_small]:text-slate-500" aria-label="Informasi transaksi">
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
            <small className="transaction-status inline-flex w-fit rounded-full bg-teal-50 px-2 py-1 font-black text-teal-700">{transaction.status}</small>
          </article>
        </section>

        <section className="transaction-detail-layout grid items-start gap-5 xl:grid-cols-[1fr_320px]">
          <article className="transaction-detail-panel rounded-2xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-sm [&_header]:mb-4 [&_header]:flex [&_header]:items-start [&_header]:justify-between [&_header]:border-b [&_header]:border-slate-100 [&_header]:pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
            <header>
              <div>
                <p>Item Transaksi</p>
                <h2>Product yang dibeli</h2>
              </div>
              <strong>{transaction.items.length} product</strong>
            </header>

            <div className="transaction-item-list grid gap-3">
              {transaction.items.map((item, index) => (
                <div className="transaction-detail-item grid grid-cols-[32px_1fr_50px_120px] gap-3 rounded-lg border border-slate-100 p-3 text-sm" key={item.productId}>
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

          <aside className="transaction-payment-panel grid gap-3 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-sm [&_div]:flex [&_div]:justify-between [&_span]:text-slate-500 [&_strong]:text-slate-950">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(transaction.subtotal)}</strong>
            </div>
            <div className="transaction-payment-total border-y border-slate-100 py-3 text-lg font-black">
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
