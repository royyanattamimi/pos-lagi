import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../../component/button/Button'
import { PageHeader } from '../../../component/header/PageHeader'
import { Input } from '../../../component/input/Input'
import { Select } from '../../../component/select/Select'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'
import './TransactionHistoryPage.css'

type TransactionHistoryPageProps = {
  transactions: TransactionRecord[]
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onProfile: () => void
  onNewTransaction: () => void
  onSelectTransaction: (transaction: TransactionRecord) => void
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

export function TransactionHistoryPage({
  transactions,
  onDashboard,
  onProduct,
  onTransaction,
  onProfile,
  onNewTransaction,
  onSelectTransaction,
  profileName,
}: TransactionHistoryPageProps) {
  const [query, setQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('Semua')
  const [dateFilter, setDateFilter] = useState('')

  const paymentMethods = useMemo(
    () => ['Semua', ...Array.from(new Set(transactions.map((transaction) => transaction.paymentMethod)))],
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesQuery = !normalizedQuery || [transaction.id, transaction.cashier]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesPayment = paymentFilter === 'Semua' || transaction.paymentMethod === paymentFilter
      const matchesDate = !dateFilter || transaction.createdAt.slice(0, 10) === dateFilter

      return matchesQuery && matchesPayment && matchesDate
    })
  }, [dateFilter, paymentFilter, query, transactions])

  const totalRevenue = filteredTransactions.reduce(
    (total, transaction) => total + transaction.grandTotal,
    0,
  )
  const totalItems = filteredTransactions.reduce(
    (total, transaction) => total + transaction.itemCount,
    0,
  )
  const averageTransaction = filteredTransactions.length
    ? totalRevenue / filteredTransactions.length
    : 0

  return (
    <main className="transaction-history-page">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={() => undefined}
        onProfile={onProfile}
        profileName={profileName}
      />

      <section className="transaction-history-content">
        <PageHeader
          eyebrow="Transaksi"
          title="Riwayat transaksi"
          description="Pantau seluruh transaksi yang tersimpan dan buka rincian setiap pembayaran."
          actions={(
            <Button
              className="new-transaction-button"
              variant="primary"
              size="large"
              type="button"
              onClick={onNewTransaction}
            >
              <Plus aria-hidden="true" />
              Buat Transaksi Baru
            </Button>
          )}
        />

        <section className="transaction-history-stats" aria-label="Ringkasan transaksi">
          <article>
            <span>Total Transaksi</span>
            <strong>{filteredTransactions.length}</strong>
          </article>
          <article>
            <span>Total Penjualan</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </article>
          <article>
            <span>Rata-rata Transaksi</span>
            <strong>{formatCurrency(averageTransaction)}</strong>
          </article>
          <article>
            <span>Total Item</span>
            <strong>{totalItems}</strong>
          </article>
        </section>

        <section className="transaction-history-panel">
          <div className="transaction-history-toolbar">
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor transaksi atau kasir"
              aria-label="Cari transaksi"
            />
            <Select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              aria-label="Filter metode pembayaran"
            >
              {paymentMethods.map((method) => <option key={method}>{method}</option>)}
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter tanggal transaksi"
            />
          </div>

          <div className="transaction-history-table">
            <div className="transaction-history-head" aria-hidden="true">
              <span>Transaksi</span>
              <span>Waktu</span>
              <span>Item</span>
              <span>Pembayaran</span>
              <span>Total</span>
              <span>Status</span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="transaction-history-empty">
                {transactions.length === 0 ? (
                  <>
                    <div>
                      <strong>Belum ada transaksi</strong>
                      <span>Mulai transaksi pertama untuk mencatat pesanan dan pembayaran.</span>
                    </div>
                    <Button variant="primary" type="button" onClick={onNewTransaction}>
                      <Plus aria-hidden="true" />
                      Buat Transaksi Baru
                    </Button>
                  </>
                ) : (
                  <span>Tidak ada transaksi yang sesuai dengan filter.</span>
                )}
              </div>
            ) : filteredTransactions.map((transaction) => (
              <Button
                className="transaction-history-row"
                type="button"
                key={transaction.id}
                onClick={() => onSelectTransaction(transaction)}
              >
                <span>
                  <strong>{transaction.id}</strong>
                  <small>{transaction.cashier}</small>
                </span>
                <span>
                  <strong>{new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  <small>{new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                </span>
                <span>{transaction.itemCount}</span>
                <span>{transaction.paymentMethod}</span>
                <strong>{formatCurrency(transaction.grandTotal)}</strong>
                <em>{transaction.status}</em>
              </Button>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
