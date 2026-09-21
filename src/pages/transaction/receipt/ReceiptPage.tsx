import { Check, Printer } from 'lucide-react'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import { PageHeader } from '../../../component/header/PageHeader'
import { Button } from '../../../component/button/Button'
import type { TransactionRecord } from '../../../types'

type ReceiptPageProps = {
  transaction: TransactionRecord
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onPaidTransactions: () => void
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
  onDashboard,
  onProduct,
  onTransaction,
  onPaidTransactions,
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
        activePage="paid-transactions"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="receipt-content content-shell">
        <PageHeader
          eyebrow="Pembayaran selesai"
          title="Nota pembayaran"
          description="Transaksi sudah lunas. Nota siap dicetak untuk pelanggan."
          actions={(
            <Button type="button" onClick={onTransaction}>
              <Check aria-hidden="true" /> Selesai
            </Button>
          )}
        />

        <section className="receipt-stage" aria-label="Nota transaksi selesai">
          <div className="receipt-success" role="status">
            <span className="receipt-success-icon"><Check size={22} aria-hidden="true" /></span>
            <strong>Pembayaran berhasil</strong>
            <span>{formatCurrency(transaction.grandTotal)} · {transaction.paymentMethod}</span>
          </div>

          <article className="thermal-receipt" aria-label={`Nota ${transaction.id}`}>
            <header className="thermal-store">
              <h2>POS LAGI</h2>
              <p>Cabang Utama</p>
              <p className="thermal-caption">NOTA PEMBAYARAN</p>
            </header>

            <dl className="thermal-meta thermal-divider">
              <div><dt>No. nota</dt><dd>{transaction.id}</dd></div>
              <div><dt>Tanggal</dt><dd>{new Date(transaction.createdAt).toLocaleDateString('id-ID')}</dd></div>
              <div><dt>Waktu</dt><dd>{new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</dd></div>
              <div><dt>Kasir</dt><dd>{transaction.cashier}</dd></div>
            </dl>

            <div className="thermal-items thermal-divider">
              {transaction.items.map((item) => (
                <div className="thermal-item" key={item.productId}>
                  <strong>{item.name}</strong>
                  <div className="thermal-line">
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  {item.note && <p className="thermal-note">Catatan: {item.note}</p>}
                </div>
              ))}
            </div>

            <dl className="thermal-totals thermal-divider">
              <div><dt>Jumlah item</dt><dd>{totalItems}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatCurrency(transaction.subtotal)}</dd></div>
              {transaction.tax !== 0 && <div><dt>Pajak</dt><dd>{formatCurrency(transaction.tax)}</dd></div>}
              <div className="thermal-grand-total"><dt>TOTAL</dt><dd>{formatCurrency(transaction.grandTotal)}</dd></div>
              <div><dt>Metode</dt><dd>{transaction.paymentMethod}</dd></div>
              <div><dt>Dibayar</dt><dd>{formatCurrency(transaction.paid)}</dd></div>
              <div><dt>Kembalian</dt><dd>{formatCurrency(transaction.change)}</dd></div>
            </dl>

            <footer className="thermal-footer">
              <strong className="thermal-paid">LUNAS</strong>
              <p>Terima kasih atas kunjungan Anda.</p>
              <p>Simpan nota ini sebagai bukti pembayaran.</p>
              <span>*** Sampai jumpa kembali ***</span>
            </footer>
          </article>

          <div className="receipt-actions">
            <Button variant="primary" type="button" onClick={handlePrint}>
              <Printer aria-hidden="true" /> Cetak nota
            </Button>
          </div>
        </section>
      </section>
    </main>
  )
}
