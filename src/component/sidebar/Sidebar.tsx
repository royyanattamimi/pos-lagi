import { Button } from '../button/Button'
import { LayoutDashboard, Package, ShoppingCart, Clock3, Store, ChevronRight } from 'lucide-react'

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
  const displayName = profileName || 'Administrator'
  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, action: onDashboard },
    { key: 'product', label: 'Produk', icon: Package, action: onProduct },
    { key: 'transaction', label: 'Transaksi', icon: ShoppingCart, action: onTransaction },
    { key: 'shift', label: 'Shift kasir', icon: Clock3, action: onShift },
  ]
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand flex items-center gap-3">
        <span className="brand-symbol"><Store size={23} aria-hidden="true" /></span>
        <div>
          <strong className="block text-lg text-slate-950">POS Lagi<span className="text-emerald-600">.</span></strong>
          <small className="block text-xs font-bold text-slate-500">Cabang Utama</small>
        </div>
      </div>

      <p className="nav-caption">WORKSPACE</p>
      <nav className="sidebar-nav" aria-label="Navigasi aplikasi">
        {navigation.map(({ key, label, icon: Icon, action }) => (
          <button key={key} className="nav-link" aria-current={activePage === key ? 'page' : undefined} onClick={action}>
            <Icon size={19} aria-hidden="true" /><span>{label}</span>
            {activePage === key && <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />}
          </button>
        ))}
      </nav>

      <section className="sidebar-profile mt-auto pt-5">
        <Button
          className={`w-full justify-start ${activePage === 'profile' ? 'bg-slate-950 text-white hover:bg-slate-900' : 'border-transparent bg-slate-50 shadow-none'}`}
          type="button"
          onClick={onProfile}
        >
          <span className="profile-avatar grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-black text-teal-800">{initials}</span>
          <span className="min-w-0 break-words text-left">
            <strong className="block">{displayName}</strong>
            <small className="block text-xs opacity-75">Administrator</small>
          </span>
        </Button>
      </section>
    </aside>
  )
}
