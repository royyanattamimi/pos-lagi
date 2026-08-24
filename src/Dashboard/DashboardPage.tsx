import { useState } from 'react'
import './DashboardPage.css'
import { ProductPage } from './Product/ProductPage'
import { TransactionPage } from './Transaksi/TransactionPage'

type DashboardPageProps = {
  onLogout: () => void
}

type ActivePage = 'dashboard' | 'product' | 'transaction'

const stats = [
  { label: 'Penjualan Hari Ini', value: 'Rp 12.450.000' },
  { label: 'Transaksi', value: '86' },
  { label: 'Product Aktif', value: '128' },
]

const products = [
  { name: 'Kopi Susu Botol', category: 'Minuman', stock: 24, price: 'Rp 18.000' },
  { name: 'Roti Gandum', category: 'Makanan', stock: 16, price: 'Rp 22.000' },
  { name: 'Beras Premium 5kg', category: 'Sembako', stock: 12, price: 'Rp 78.000' },
]

const transactions = [
  { id: '#POS-1048', cashier: 'Admin', items: '6 item', total: 'Rp 428.000', status: 'Lunas' },
  { id: '#POS-1047', cashier: 'Admin', items: '14 item', total: 'Rp 1.240.000', status: 'Lunas' },
  { id: '#POS-1046', cashier: 'Admin', items: '3 item', total: 'Rp 89.000', status: 'Refund' },
]

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')

  if (activePage === 'transaction') {
    return (
      <TransactionPage
        onBack={() => setActivePage('dashboard')}
        onLogout={onLogout}
      />
    )
  }

  if (activePage === 'product') {
    return (
      <ProductPage
        onBack={() => setActivePage('dashboard')}
        onLogout={onLogout}
      />
    )
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span>PL</span>
          <div>
            <strong>POS Lagi</strong>
            <small>Cabang Utama</small>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Navigasi dashboard">
          <a href="#dashboard">Dashboard</a>
          <button type="button" onClick={() => setActivePage('product')}>Product</button>
          <button type="button" onClick={() => setActivePage('transaction')}>Transaksi</button>
        </nav>

        <button className="logout-button" type="button" onClick={onLogout}>Logout</button>
      </aside>

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
            <article className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

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
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
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
      </section>
    </main>
  )
}
