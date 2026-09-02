import { Button } from '../button/Button'
import './Sidebar.css'

type SidebarPage = 'dashboard' | 'product' | 'transaction' | 'shift' | 'profile'

type SidebarProps = {
  activePage: SidebarPage
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  profileName?: string
}

export function Sidebar({
  activePage,
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  profileName,
}: SidebarProps) {
  const displayName = profileName || 'Profile'
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
        <Button
          className={activePage === 'dashboard' ? 'active' : ''}
          type="button"
          onClick={onDashboard}
        >
          Dashboard
        </Button>
        <Button
          className={activePage === 'product' ? 'active' : ''}
          type="button"
          onClick={onProduct}
        >
          Product
        </Button>
        <Button
          className={activePage === 'transaction' ? 'active' : ''}
          type="button"
          onClick={onTransaction}
        >
          Transaksi
        </Button>
        <Button
          className={activePage === 'shift' ? 'active' : ''}
          type="button"
          onClick={onShift}
        >
          Shift
        </Button>
        <Button
          className={activePage === 'profile' ? 'active' : ''}
          type="button"
          onClick={onProfile}
        >
          Profile
        </Button>
      </nav>

      <section className="sidebar-profile">
        <Button
          className={activePage === 'profile' ? 'profile-button active' : 'profile-button'}
          type="button"
          onClick={onProfile}
        >
          <span className="profile-avatar">{initials}</span>
          <span>
            <strong>{displayName}</strong>
            <small>Atur profile</small>
          </span>
        </Button>
      </section>
    </aside>
  )
}
