import './Sidebar.css'

type SidebarPage = 'dashboard' | 'product' | 'transaction' | 'shift' | 'profile'

type SidebarProps = {
  activePage: SidebarPage
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
}

export function Sidebar({
  activePage,
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
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
        <button
          className={activePage === 'shift' ? 'active' : ''}
          type="button"
          onClick={onShift}
        >
          Shift
        </button>
        <button
          className={activePage === 'profile' ? 'active' : ''}
          type="button"
          onClick={onProfile}
        >
          Profile
        </button>
      </nav>

      <section className="sidebar-profile">
        <button
          className={activePage === 'profile' ? 'profile-button active' : 'profile-button'}
          type="button"
          onClick={onProfile}
        >
          <span className="profile-avatar">AK</span>
          <span>
            <strong>Admin Kasir</strong>
            <small>Atur profile</small>
          </span>
        </button>
      </section>
    </aside>
  )
}
