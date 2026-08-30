import { useState } from 'react'
import './DashboardPage.css'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { ProductPage } from '../product/ProductPage'
import { ProfilePage } from '../profile/ProfilePage'
import { ShiftPage } from '../shift/ShiftPage'
import { TransactionPage } from '../transaction/TransactionPage'

type DashboardPageProps = {
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'transaction' | 'shift' | 'profile'
type DashboardDetail = 'sales-today' | 'transactions' | 'active-products' | null

const stats = [
  { key: 'sales-today', label: 'Penjualan Hari Ini', value: 'Rp 12.450.000' },
  { key: 'transactions', label: 'Transaksi', value: '86' },
  { key: 'active-products', label: 'Product Aktif', value: '128' },
]

const salesToday = [
  { time: '08:00 - 10:00', orders: 24, total: 'Rp 3.420.000', method: 'Cash' },
  { time: '10:00 - 12:00', orders: 31, total: 'Rp 4.780.000', method: 'QRIS' },
  { time: '12:00 - 14:00', orders: 18, total: 'Rp 2.650.000', method: 'Debit' },
  { time: '14:00 - 16:00', orders: 13, total: 'Rp 1.600.000', method: 'Cash' },
]

const products = [
  {
    name: 'Kopi Susu Botol',
    category: 'Minuman',
    stock: 24,
    price: 'Rp 18.000',
    image: '/product-images/coffee-real.png',
  },
  {
    name: 'Roti Gandum',
    category: 'Makanan',
    stock: 16,
    price: 'Rp 22.000',
    image: '/product-images/bread-real.png',
  },
  {
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    stock: 12,
    price: 'Rp 78.000',
    image: '/product-images/rice-real.png',
  },
]

const transactions = [
  { id: '#POS-1048', cashier: 'Admin', items: '6 item', total: 'Rp 428.000', status: 'Lunas' },
  { id: '#POS-1047', cashier: 'Admin', items: '14 item', total: 'Rp 1.240.000', status: 'Lunas' },
  { id: '#POS-1046', cashier: 'Admin', items: '3 item', total: 'Rp 89.000', status: 'Refund' },
]

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [activeDetail, setActiveDetail] = useState<DashboardDetail>(null)
  const [isShiftOpen, setIsShiftOpen] = useState(true)

  if (activePage === 'transaction') {
    return (
      <TransactionPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
      />
    )
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
      />
    )
  }

  if (activePage === 'profile') {
    return (
      <ProfilePage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        onLogout={onLogout}
        isShiftOpen={isShiftOpen}
      />
    )
  }

  if (activePage === 'shift') {
    return (
      <ShiftPage
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
        isShiftOpen={isShiftOpen}
        onToggleShift={() => setIsShiftOpen((currentValue) => !currentValue)}
      />
    )
  }

  return (
    <main className="dashboard-page">
      <Sidebar
        activePage="dashboard"
        onDashboard={() => setActivePage('dashboard')}
        onProduct={() => setActivePage('product')}
        onTransaction={() => setActivePage('transaction')}
        onShift={() => setActivePage('shift')}
        onProfile={() => setActivePage('profile')}
      />

      <section className="dashboard-content">
        <header className="dashboard-header" id="dashboard">
          <div>
            <p>Dashboard</p>
            <h1>Ringkasan operasional toko</h1>
          </div>
          <button type="button" onClick={() => setActivePage('transaction')}>Transaksi Baru</button>
        </header>

        <section className="stats-grid" aria-label="Ringkasan data">
          {stats.map((stat) => (
            <button
              className="stat-card"
              type="button"
              key={stat.label}
              onClick={() => setActiveDetail(stat.key as DashboardDetail)}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>Lihat rincian</small>
            </button>
          ))}
        </section>

        {activeDetail ? (
          <section className="dashboard-detail-panel">
            <div className="panel-header">
              <div>
                <p>Rincian Dashboard</p>
                <h2>
                  {activeDetail === 'sales-today' && 'Penjualan Hari Ini'}
                  {activeDetail === 'transactions' && 'Transaksi'}
                  {activeDetail === 'active-products' && 'Product Aktif'}
                </h2>
              </div>
              <button type="button" onClick={() => setActiveDetail(null)}>Kembali</button>
            </div>

            {activeDetail === 'sales-today' && (
              <div className="dashboard-detail-list">
                {salesToday.map((sale) => (
                  <div className="sales-detail-row" key={sale.time}>
                    <div>
                      <strong>{sale.time}</strong>
                      <span>{sale.orders} transaksi</span>
                    </div>
                    <span>{sale.method}</span>
                    <strong>{sale.total}</strong>
                  </div>
                ))}
              </div>
            )}

            {activeDetail === 'transactions' && (
              <div className="dashboard-detail-list">
                {transactions.map((transaction) => (
                  <div className="transaction-row" key={transaction.id}>
                    <div>
                      <strong>{transaction.id}</strong>
                      <span>{transaction.cashier}</span>
                    </div>
                    <span>{transaction.items}</span>
                    <strong>{transaction.total}</strong>
                    <em className={transaction.status === 'Refund' ? 'refund' : ''}>{transaction.status}</em>
                  </div>
                ))}
              </div>
            )}

            {activeDetail === 'active-products' && (
              <div className="dashboard-detail-list">
                {products.map((product) => (
                  <div className="product-row" key={product.name}>
                    <div className="dashboard-product-name">
                      <img src={product.image} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <span>{product.stock} stok</span>
                    <strong>{product.price}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
        <section className="dashboard-grid">
          <article className="panel" id="product">
            <div className="panel-header">
              <div>
                <p>Product</p>
                <h2>Daftar product</h2>
              </div>
              <button type="button" onClick={() => setActivePage('product')}>Add Product</button>
            </div>

            <div className="product-list">
              {products.map((product) => (
                <div className="product-row" key={product.name}>
                  <div className="dashboard-product-name">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                  </div>
                  <span>{product.stock} stok</span>
                  <strong>{product.price}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" id="transaksi">
            <div className="panel-header">
              <div>
                <p>Transaksi</p>
                <h2>Transaksi terbaru</h2>
              </div>
              <button type="button" onClick={() => setActivePage('transaction')}>Lihat Semua</button>
            </div>

            <div className="transaction-list">
              {transactions.map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <div>
                    <strong>{transaction.id}</strong>
                    <span>{transaction.cashier}</span>
                  </div>
                  <span>{transaction.items}</span>
                  <strong>{transaction.total}</strong>
                  <em className={transaction.status === 'Refund' ? 'refund' : ''}>{transaction.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>
        )}
      </section>
    </main>
  )
}
