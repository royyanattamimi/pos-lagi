import { useState } from 'react'
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
  onAddProduct: (product: ProductInput) => void
  onUpdateProduct: (productId: number, product: ProductInput) => void
  onDeleteProduct: (productId: number) => void
  onCompleteTransaction: (transaction: TransactionRecord) => void
  onEndShift: () => void
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'active-products' | 'transaction' | 'checkout' | 'shift' | 'profile'
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
  onEndShift,
  onLogout,
}: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [activeDetail, setActiveDetail] = useState<DashboardDetail>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null)
  const isShiftOpen = currentShift?.status === 'Berjalan'
  const todayKey = new Date().toLocaleDateString('id-ID')
  const todayTransactions = transactions.filter(
    (transaction) => new Date(transaction.createdAt).toLocaleDateString('id-ID') === todayKey,
  )
  const salesToday = todayTransactions.reduce((total, transaction) => total + transaction.grandTotal, 0)
  const activeProducts = products
  const stats = [
    { key: 'sales-today', label: 'Penjualan hari ini', value: formatCurrency(salesToday), icon: Wallet, tone: 'green' },
    { key: 'transactions', label: 'Total transaksi', value: String(transactions.length), icon: ReceiptText, tone: 'blue' },
    { key: 'active-products', label: 'Produk aktif', value: String(activeProducts.length), icon: Package, tone: 'amber' },
  ]
  const weeklySales = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + index)
    const total = transactions.filter((item) => new Date(item.createdAt).toLocaleDateString('id-ID') === date.toLocaleDateString('id-ID')).reduce((sum, item) => sum + item.grandTotal, 0)
    return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), date: date.toLocaleDateString('id-ID'), total }
  })
  const maxSales = Math.max(...weeklySales.map((day) => day.total), 1)
  const weeklyTotal = weeklySales.reduce((sum, day) => sum + day.total, 0)
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
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
        onTransaction={() => {
          setSelectedTransaction(null)
          setActivePage('checkout')
        }}
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
        onTransaction={() => setActivePage('checkout')}
        onHistory={() => setActivePage('transaction')}
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
        transactions={transactions}
        onShift={() => setActivePage('shift')}
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
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
      onTransaction={() => setActivePage('checkout')}
      onShift={() => setActivePage('shift')}
      onProfile={() => setActivePage('profile')} />
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('checkout')}
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
        onTransaction={() => setActivePage('checkout')}
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
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        currentShift={currentShift}
        shiftHistory={shiftHistory}
        transactions={transactions}
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
        onTransaction={() => setActivePage('checkout')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        profileName={currentShift?.cashierName}
      />

      <section className="dashboard-content content-shell">
        <DashboardHeader
          products={products}
          transactions={transactions}
          onOpenProduct={() => setActivePage('product')}
          onOpenTransaction={setSelectedTransaction}
        />

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
            <div className="section-heading"><div><h2>Aktivitas penjualan</h2><span className="text-sm text-slate-500">7 hari terakhir</span></div><span className="status-badge">IDR</span></div>
            <strong className="weekly-total">{formatCurrency(weeklyTotal)}</strong>
            <div className="sales-chart" aria-label="Grafik penjualan tujuh hari terakhir">
              {weeklySales.map((day) => <div className="chart-column" key={day.date} tabIndex={0}>
                <div className="chart-track"><div className="chart-bar" style={{ height: `${day.total > 0 ? Math.max(3, day.total / maxSales * 100) : 0}%` }} /></div>
                <span>{day.label}</span>
                <span className="sr-only">{day.date}: {formatCurrency(day.total)}</span>
                <span className="chart-tooltip">{day.date}<br />{formatCurrency(day.total)}</span>
              </div>)}
            </div>
            {weeklyTotal === 0 && <p className="text-center text-xs text-slate-500">Belum ada penjualan dalam 7 hari terakhir.</p>}
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
          <div className="section-heading"><div><h2>Transaksi terbaru</h2><span className="text-sm text-slate-500">Aktivitas terakhir toko Anda</span></div><Button size="small" variant="ghost" onClick={() => setActivePage('transaction')}>Lihat semua <ArrowUpRight aria-hidden="true" /></Button></div>
          {recentTransactions.length ? recentTransactions.map((transaction) => <button className="recent-sale-row" key={transaction.id} onClick={() => setSelectedTransaction(transaction)}>
            <span className="sale-icon"><ReceiptText size={19} aria-hidden="true" /></span><span className="min-w-0"><strong className="block break-words">{transaction.id}</strong><small className="text-slate-500">{transaction.cashier} · {transaction.itemCount} item</small></span><span className="sale-method">{transaction.paymentMethod}</span><strong>{formatCurrency(transaction.grandTotal)}</strong><ArrowUpRight size={16} aria-hidden="true" />
          </button>) : <div className="dashboard-empty"><ReceiptText size={32} strokeWidth={1.4} aria-hidden="true" /><strong>Belum ada transaksi</strong><Button size="small" onClick={() => setActivePage('checkout')}><Plus aria-hidden="true" /> Transaksi baru</Button></div>}
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
