import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../../component/button/Button'
import { PageHeader } from '../../../component/header/PageHeader'
import { Input } from '../../../component/input/Input'
import { Select } from '../../../component/select/Select'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'

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
    <main className="transaction-history-page min-h-screen grid grid-cols-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900 md:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar
        activePage="transaction"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={() => undefined}
        onProfile={onProfile}
        profileName={profileName}
      />

      <section className="transaction-history-content min-w-0 p-5 md:p-8">
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

        <section className="transaction-history-stats mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 [&_article]:rounded-lg [&_article]:border [&_article]:border-slate-200 [&_article]:bg-white [&_article]:p-4 [&_article]:shadow-lg [&_article]:shadow-slate-900/5 [&_span]:text-sm [&_span]:font-bold [&_span]:text-slate-500 [&_strong]:mt-1 [&_strong]:block [&_strong]:text-xl [&_strong]:font-black" aria-label="Ringkasan transaksi">
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

        <section className="transaction-history-panel rounded-2xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-sm">
          <div className="transaction-history-toolbar mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
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

          <div className="transaction-history-table grid gap-3">
            <div className="transaction-history-head hidden grid-cols-[1fr_150px_70px_120px_130px_90px] gap-3 px-3 text-xs font-black uppercase text-slate-400 lg:grid" aria-hidden="true">
              <span>Transaksi</span>
              <span>Waktu</span>
              <span>Item</span>
              <span>Pembayaran</span>
              <span>Total</span>
              <span>Status</span>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="transaction-history-empty flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
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
                className="transaction-history-row grid w-full gap-3 rounded-2xl border border-slate-100 bg-white/90 p-3 text-left hover:border-slate-300 lg:grid-cols-[1fr_150px_70px_120px_130px_90px] lg:items-center [&_small]:block [&_small]:text-xs [&_small]:text-slate-500 [&_em]:w-fit [&_em]:rounded-full [&_em]:bg-teal-50 [&_em]:px-2 [&_em]:py-1 [&_em]:text-xs [&_em]:font-black [&_em]:not-italic [&_em]:text-teal-700"
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
