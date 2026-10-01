import { ThermalReceipt } from './ThermalReceipt'
import { useProfile } from '../../../context/useProfile'
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
  onSettings: () => void
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
  onSettings,
  onProfile,
}: ReceiptPageProps) {
  const { settings, profile } = useProfile()

  function handlePrint() {
    window.print()
  }

  return (
    <main className="receipt-page app-shell" data-paper={settings.receiptPaper}>
      <Sidebar
        activePage="paid-transactions"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onSettings={onSettings} onProfile={onProfile}
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

          <ThermalReceipt transaction={transaction} settings={settings} branch={profile.branch} />

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
