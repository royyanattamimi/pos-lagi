import { Button } from '../button/Button'

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
  onProfile,
  profileName,
}: SidebarProps) {
  const displayName = profileName || 'Administrator'
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="app-sidebar sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white p-5 max-md:static max-md:h-auto">
      <div className="sidebar-brand flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-300 font-black text-teal-950">PL</span>
        <div>
          <strong className="block text-slate-950">POS Lagi</strong>
          <small className="block text-xs font-bold text-slate-500">Cabang Utama</small>
        </div>
      </div>

      <nav className="sidebar-nav mt-8 grid gap-2" aria-label="Navigasi aplikasi">
        <Button
          className={activePage === 'dashboard' ? 'bg-slate-950 text-white hover:bg-slate-900' : 'justify-start'}
          type="button"
          onClick={onDashboard}
        >
          Dashboard
        </Button>
        <Button
          className={activePage === 'product' ? 'bg-slate-950 text-white hover:bg-slate-900' : 'justify-start'}
          type="button"
          onClick={onProduct}
        >
          Product
        </Button>
        <Button
          className={activePage === 'transaction' ? 'bg-slate-950 text-white hover:bg-slate-900' : 'justify-start'}
          type="button"
          onClick={onTransaction}
        >
          Transaksi
        </Button>
      </nav>

      <section className="sidebar-profile mt-auto pt-5">
        <Button
          className={`w-full justify-start ${activePage === 'profile' ? 'bg-slate-950 text-white hover:bg-slate-900' : ''}`}
          type="button"
          onClick={onProfile}
        >
          <span className="profile-avatar grid h-9 w-9 place-items-center rounded-full bg-teal-100 text-sm font-black text-teal-800">{initials}</span>
          <span>
            <strong className="block">{displayName}</strong>
            <small className="block text-xs opacity-75">Administrator</small>
          </span>
        </Button>
      </section>
    </aside>
  )
}
