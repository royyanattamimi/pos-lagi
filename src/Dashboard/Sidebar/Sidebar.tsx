import './Sidebar.css'

type SidebarPage = 'dashboard' | 'product' | 'transaction'

type SidebarProps = {
  activePage: SidebarPage
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onLogout: () => void
}

export function Sidebar({
  activePage,
  onDashboard,
  onProduct,
  onTransaction,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span>PL</span>
        <div>
          <strong>POS Lagi</strong>
          <small>Cabang Utama</small>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigasi aplikasi">
        <button
          className={activePage === 'dashboard' ? 'active' : ''}
          type="button"
          onClick={onDashboard}
        >
          Dashboard
        </button>
        <button
          className={activePage === 'product' ? 'active' : ''}
          type="button"
          onClick={onProduct}
        >
          Product
        </button>
        <button
          className={activePage === 'transaction' ? 'active' : ''}
          type="button"
          onClick={onTransaction}
        >
          Transaksi
        </button>
      </nav>

      <button className="sidebar-logout" type="button" onClick={onLogout}>Logout</button>
    </aside>
  )
}
