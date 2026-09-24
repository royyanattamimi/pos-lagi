import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '../../../component/button/Button'
import { PageHeader } from '../../../component/header/PageHeader'
import { Input } from '../../../component/input/Input'
import { Select } from '../../../component/select/Select'
import { Sidebar } from '../../../component/sidebar/Sidebar'
import type { TransactionRecord } from '../../../types'

type TransactionHistoryPageProps = {
  transactions: TransactionRecord[]
  title?: string
  initialDateFilter?: string
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onPaidTransactions: () => void
  onProfile: () => void
  onShift: () => void
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

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TransactionHistoryPage({
  transactions,
  title = 'Transaksi lunas',
  initialDateFilter = '',
  onDashboard,
  onProduct,
  onTransaction,
  onPaidTransactions,
  onProfile,
  onShift,
  onNewTransaction,
  onSelectTransaction,
  profileName,
}: TransactionHistoryPageProps) {
  const [query, setQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('Semua')
  const [today, setToday] = useState(() => localDateKey(new Date()))
  const [selectedDate, setSelectedDate] = useState(() =>
    initialDateFilter === localDateKey(new Date()) ? '' : initialDateFilter,
  )
  const dateFilter = selectedDate || today
  const dateLabel = new Date(`${dateFilter}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const updateToday = () => {
      const now = new Date()
      setToday(localDateKey(now))
      clearTimeout(timer)
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(updateToday, midnight.getTime() - now.getTime())
    }
    updateToday()
    window.addEventListener('focus', updateToday)
    document.addEventListener('visibilitychange', updateToday)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', updateToday)
      document.removeEventListener('visibilitychange', updateToday)
    }
  }, [])

  const paymentMethods = useMemo(
    () => ['Semua', ...Array.from(new Set(transactions.map((transaction) => transaction.paymentMethod)))],
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return transactions.filter((transaction) => {
      if (transaction.status !== 'Lunas') return false
      const matchesQuery = !normalizedQuery || [transaction.id, transaction.cashier]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesPayment = paymentFilter === 'Semua' || transaction.paymentMethod === paymentFilter
      const transactionDate = new Date(transaction.createdAt)
      const matchesDate = localDateKey(transactionDate) === dateFilter

      return matchesQuery && matchesPayment && matchesDate
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
    <main className="transaction-history-page app-shell">
      <Sidebar
        activePage="paid-transactions"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onProfile={onProfile}
        profileName={profileName}
      />

      <section className="transaction-history-content content-shell">
        <PageHeader
          eyebrow="Riwayat pembayaran"
          title={title}
          description="Ringkasan transaksi lunas per hari. Tanggal hari ini mengikuti waktu perangkat secara otomatis."
          actions={(
            <>
            <Button type="button" onClick={onDashboard}>
              <ArrowLeft aria-hidden="true" /> Dashboard
            </Button>
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
            </>
          )}
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div aria-live="polite">
            <h2 className="text-base font-bold text-slate-900">
              {dateFilter === today ? 'Transaksi hari ini' : 'Transaksi harian'}
            </h2>
            <p className="text-sm text-slate-500">{dateLabel}</p>
          </div>
          {selectedDate && (
            <Button type="button" size="small" onClick={() => setSelectedDate('')}>
              Kembali ke hari ini
            </Button>
          )}
        </div>

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

        <section className="transaction-history-panel surface-panel">
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
              onChange={(event) => setSelectedDate(event.target.value === today ? '' : event.target.value)}
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
              <div className="transaction-history-empty flex items-center justify-between gap-3 empty-state">
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
                  <span>Tidak ada transaksi pada tanggal ini yang sesuai dengan filter.</span>
                )}
              </div>
            ) : filteredTransactions.map((transaction) => (
              <Button
                className="transaction-history-row grid w-full gap-3 data-row text-left lg:grid-cols-[1fr_150px_70px_120px_130px_90px] lg:items-center block text-xs text-slate-500 [&_em]:w-fit [&_em]:rounded-full [&_em]:bg-teal-50 [&_em]:px-2 [&_em]:py-1 [&_em]:text-xs [&_em]:font-black [&_em]:not-italic [&_em]:text-teal-700"
                type="button"
                key={transaction.id}
                onClick={() => onSelectTransaction(transaction)}
              >
                <span>
                  <strong>{transaction.id}</strong>
                  <small>{transaction.cashier}</small>
                </span>
                <span>
                  <strong>{new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
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
