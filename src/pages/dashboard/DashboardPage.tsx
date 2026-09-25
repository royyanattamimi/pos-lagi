import { useState } from 'react'
import { SalesChart } from './SalesChart'
import { ActiveProductsPage } from '../product/ActiveProductsPage'
import { ArrowUpRight, Plus, Wallet, ReceiptText, Package, Clock3 } from 'lucide-react'
import { DashboardHeader } from '../../component/header/DashboardHeader'
import { PageHeader } from '../../component/header/PageHeader'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { Button } from '../../component/button/Button'
import { ProductPage } from '../product/ProductPage'
import { ProfilePage } from '../profile/ProfilePage'
import { ShiftPage } from '../shift/ShiftPage'
import { TransactionPage } from '../transaction/TransactionPage'
import { TransactionDetailPage } from '../transaction/detail/TransactionDetailPage'
import { TransactionHistoryPage } from '../transaction/history/TransactionHistoryPage'
import type { Product, ProductInput, ShiftSession, TransactionRecord } from '../../types'

type DashboardPageProps = {
  products: Product[]
  transactions: TransactionRecord[]
  currentShift: ShiftSession | null
  shiftHistory: ShiftSession[]
  onAddProduct: (product: ProductInput) => Promise<void>
  onUpdateProduct: (productId: number, product: ProductInput) => Promise<void>
  onDeleteProduct: (productId: number) => Promise<void>
  onCompleteTransaction: (transaction: TransactionRecord) => Promise<void>
  onShiftReports: (shiftId?: string) => void
  onEndShift: () => void
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'active-products' | 'transaction' | 'checkout' | 'shift' | 'profile'
type SalesPeriod = 'weekly' | 'monthly' | 'yearly'
type DashboardDetail = 'sales-today' | 'transactions' | null

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function DashboardPage({
  products,
  transactions,
  currentShift,
  shiftHistory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onCompleteTransaction,
  onShiftReports,
  onEndShift,
  onLogout,
}: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [activeDetail, setActiveDetail] = useState<DashboardDetail>(null)
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('weekly')
  const [historyDateFilter, setHistoryDateFilter] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null)
  function openCheckout() {
    setSelectedTransaction(null)
    setActivePage('checkout')
  }

  function openTransactions() {
    setSelectedTransaction(null)
    setHistoryDateFilter('')
    setActivePage('transaction')
  }

  const isShiftOpen = currentShift?.status === 'Berjalan'
  const todayKey = new Date().toLocaleDateString('id-ID')
  const todayTransactions = transactions.filter(
    (transaction) => new Date(transaction.createdAt).toLocaleDateString('id-ID') === todayKey,
  )
  const salesToday = todayTransactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
  const activeProducts = products
  const stats = [
    { key: 'sales-today', label: 'Penjualan hari ini', value: formatCurrency(salesToday), icon: Wallet, tone: 'green' },
    { key: 'transactions', label: 'Total transaksi hari ini', value: String(todayTransactions.length), icon: ReceiptText, tone: 'blue' },
    { key: 'active-products', label: 'Produk aktif', value: String(activeProducts.length), icon: Package, tone: 'amber' },
  ]
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const periodDescription = salesPeriod === 'weekly'
    ? '7 hari terakhir'
    : salesPeriod === 'monthly'
      ? now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : String(year)
  const bucketCount = salesPeriod === 'weekly' ? 7
    : salesPeriod === 'monthly' ? new Date(year, month + 1, 0).getDate() : 12
  const periodSales = Array.from({ length: bucketCount }, (_, index) => {
    const start = salesPeriod === 'yearly'
      ? new Date(year, index, 1)
      : new Date(year, month, salesPeriod === 'weekly' ? now.getDate() - 6 + index : index + 1)
    const end = salesPeriod === 'yearly'
      ? new Date(year, index + 1, 1)
      : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
    const total = transactions.reduce((sum, transaction) => {
      const createdAt = new Date(transaction.createdAt)
      return createdAt >= start && createdAt < end ? sum + transaction.grandTotal : sum
    }, 0)
    const label = salesPeriod === 'yearly'
      ? start.toLocaleDateString('id-ID', { month: 'short' })
      : salesPeriod === 'monthly' ? String(start.getDate())
        : start.toLocaleDateString('id-ID', { weekday: 'short' })
    const date = salesPeriod === 'yearly'
      ? start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : start.toLocaleDateString('id-ID')
    return { label, date, total }
  })
  const periodTotal = periodSales.reduce((sum, day) => sum + day.total, 0)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (selectedTransaction) {
    return (
      <TransactionDetailPage
        transaction={selectedTransaction}
        onShift={() => { setSelectedTransaction(null); setActivePage('shift') }}
        onBack={() => setSelectedTransaction(null)}
        onDashboard={() => {
          setSelectedTransaction(null)
          setActivePage('dashboard')
        }}
        onProduct={() => {
          setSelectedTransaction(null)
          setActivePage('product')
        }}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onProfile={() => {
          setSelectedTransaction(null)
          setActivePage('profile')
        }}
        profileName={currentShift?.cashierName}
      />
    )
  }

  if (activePage === 'checkout') {
    return (
      <TransactionPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        currentShift={currentShift}
        onCompleteTransaction={onCompleteTransaction}
      />
    )
  }

  if (activePage === 'transaction') {
    return (
      <TransactionHistoryPage
        key={`${activePage}-${historyDateFilter}`}
        transactions={transactions}
        initialDateFilter={historyDateFilter}
        onShift={() => setActivePage('shift')}
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onProfile={() => setActivePage('profile')}
        onNewTransaction={() => setActivePage('checkout')}
        onSelectTransaction={setSelectedTransaction}
        profileName={currentShift?.cashierName}
      />
    )
  }

  if (activePage === 'active-products') {
    return <ActiveProductsPage products={products} profileName={currentShift?.cashierName}
      onDashboard={() => setActivePage('dashboard')}
      onProduct={() => setActivePage('product')}
      onTransaction={openCheckout} onPaidTransactions={openTransactions}
      onShift={() => setActivePage('shift')}
      onProfile={() => setActivePage('profile')} />
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        products={products}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
      />
    )
  }

  if (activePage === 'profile') {
    return (
      <ProfilePage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        onLogout={onLogout}
        isShiftOpen={isShiftOpen}
        currentShift={currentShift}
      />
    )
  }

  if (activePage === 'shift') {
    return (
      <ShiftPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        transactions={transactions}
        onShiftReports={onShiftReports}
        onEndShift={onEndShift}
      />
    )
  }

  return (
    <main className="dashboard-page app-shell">
      <Sidebar
        activePage="dashboard"
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={openCheckout} onPaidTransactions={openTransactions}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        profileName={currentShift?.cashierName}
      />

      <section className="dashboard-content content-shell">
        <DashboardHeader />

        <PageHeader
          eyebrow="Dashboard"
          title={`Selamat datang, ${currentShift?.cashierName || 'Administrator'}`}
          description="Ringkasan toko hari ini"
          actions={<Button variant="primary" onClick={() => setActivePage('checkout')}><Plus aria-hidden="true" /> Transaksi baru</Button>}
        />

        <section className="stats-grid mb-6 grid gap-4 lg:grid-cols-3" aria-label="Ringkasan data">
          {stats.map((stat) => (
            <button
              className={`stat-card metric-card metric-${stat.tone}`}
              type="button"
              key={stat.label}
              onClick={() => {
                if (stat.key === 'active-products') {
                  setActiveDetail(null)
                  setActivePage('active-products')
                  window.scrollTo(0, 0)
                  return
                }
                if (stat.key === 'transactions') {
                  const today = new Date()
                  setHistoryDateFilter(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
                  setActiveDetail(null)
                  setActivePage('transaction')
                  return
                }

                setActiveDetail(stat.key as DashboardDetail)
              }}
            >
              <span className="metric-label"><span className="metric-icon"><stat.icon size={20} aria-hidden="true" /></span>{stat.label}<ArrowUpRight size={16} aria-hidden="true" /></span>
              <strong>{stat.value}</strong>
              <small>{stat.key === 'sales-today' ? `${todayTransactions.length} transaksi hari ini` : 'Lihat rincian'} <ArrowUpRight size={13} aria-hidden="true" /></small>
            </button>
          ))}
        </section>

        <div className="dashboard-overview">
          <section className="sales-overview">
            <div className="section-heading">
              <div><h2>Aktivitas penjualan</h2><span className="text-sm text-slate-500">{periodDescription}</span></div>
              <select
                className="sales-period-select status-badge cursor-pointer border border-slate-200 focus:outline-2 focus:outline-teal-600"
                aria-label="Periode aktivitas penjualan"
                value={salesPeriod}
                onChange={(event) => setSalesPeriod(event.target.value as SalesPeriod)}
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
            <strong className="weekly-total">{formatCurrency(periodTotal)}</strong>
            <SalesChart key={salesPeriod} data={periodSales} description={periodDescription} />
            {periodTotal === 0 && <p className="text-center text-xs text-slate-500">Belum ada penjualan pada periode ini.</p>}
          </section>
          <section className="shift-overview">
            <div className="section-heading"><h2>Shift saat ini</h2><Clock3 size={20} className="text-emerald-700" aria-hidden="true" /></div>
            <span className={`status-badge ${isShiftOpen ? 'status-open' : ''}`}>{isShiftOpen ? 'Berjalan' : 'Tidak aktif'}</span>
            <strong className="mt-5 block text-xl font-semibold break-words">{currentShift?.cashierName || 'Belum ada kasir'}</strong>
            <dl className="shift-details"><div><dt>Jadwal shift</dt><dd>{currentShift?.shiftTime || '-'}</dd></div><div><dt>Kas awal</dt><dd>{formatCurrency(currentShift?.openingCash || 0)}</dd></div><div><dt>Transaksi hari ini</dt><dd>{todayTransactions.length}</dd></div></dl>
            <Button className="w-full" onClick={() => setActivePage('shift')}>Detail shift <ArrowUpRight aria-hidden="true" /></Button>
          </section>
        </div>
        <section className="recent-sales">
          <div className="section-heading">
            <div>
              <h2>Transaksi lunas terbaru</h2>
              <span className="text-sm text-slate-500">Pembayaran terakhir yang sudah selesai</span>
            </div>
          </div>
          {recentTransactions.length ? recentTransactions.map((transaction) => (
            <button
              type="button"
              className="recent-sale-row"
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
            >
              <span className="sale-icon"><ReceiptText size={19} aria-hidden="true" /></span>
              <span className="min-w-0">
                <strong className="block break-words">{transaction.id}</strong>
                <small className="text-slate-500">{transaction.cashier} · {transaction.itemCount} item</small>
              </span>
              <span className="sale-method">{transaction.paymentMethod}</span>
              <strong>{formatCurrency(transaction.grandTotal)}</strong>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )) : (
            <div className="dashboard-empty">
              <ReceiptText size={32} strokeWidth={1.4} aria-hidden="true" />
              <strong>Belum ada transaksi</strong>
            </div>
          )}
        </section>

        {activeDetail && (
          <section className="dashboard-detail-panel surface-panel">
            <div className="panel-header mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <div>
                <p>Rincian Dashboard</p>
                <h2>
                  {activeDetail === 'sales-today' && 'Penjualan Hari Ini'}
                  {activeDetail === 'transactions' && 'Transaksi'}
                </h2>
              </div>
              <Button type="button" onClick={() => setActiveDetail(null)}>Kembali</Button>
            </div>

            {activeDetail === 'sales-today' && (
              <div className="dashboard-detail-list grid gap-3">
                {todayTransactions.length === 0 ? (
                  <div className="empty-dashboard-state empty-state">Belum ada penjualan hari ini.</div>
                ) : todayTransactions.map((sale) => (
                  <Button
                    className="sales-detail-row transaction-detail-trigger grid w-full grid-cols-[1fr_auto] gap-3 data-row text-left hover:border-slate-300"
                    type="button"
                    key={sale.id}
                    onClick={() => setSelectedTransaction(sale)}
                  >
                    <div>
                      <strong>{new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{sale.itemCount} item</span>
                    </div>
                    <span>{sale.paymentMethod}</span>
                    <strong>{formatCurrency(sale.grandTotal)}</strong>
                  </Button>
                ))}
              </div>
            )}

            {activeDetail === 'transactions' && (
              <div className="dashboard-detail-list grid gap-3">
                {transactions.length === 0 ? (
                  <div className="empty-dashboard-state empty-state">Belum ada transaksi. Buat transaksi baru setelah product tersedia.</div>
                ) : transactions.map((transaction) => (
                  <Button
                    className="transaction-row transaction-detail-trigger grid w-full grid-cols-[1fr_auto] gap-3 data-row text-left hover:border-slate-300"
                    type="button"
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div>
                      <strong>{transaction.id}</strong>
                      <span>{transaction.cashier}</span>
                    </div>
                    <span>{transaction.itemCount} item</span>
                    <strong>{formatCurrency(transaction.grandTotal)}</strong>
                    <em>{transaction.status}</em>
                  </Button>
                ))}
              </div>
            )}

          </section>
        )}
      </section>
    </main>
  )
}
