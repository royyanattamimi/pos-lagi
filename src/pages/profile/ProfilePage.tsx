import { useState } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import type { ShiftSession } from '../../types'
import './ProfilePage.css'

type ProfilePageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  onLogout: () => void
  isShiftOpen: boolean
  currentShift: ShiftSession | null
}

export function ProfilePage({
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  onLogout,
  isShiftOpen,
  currentShift,
}: ProfilePageProps) {
  const [showLogoutReminder, setShowLogoutReminder] = useState(false)
  const [profile, setProfile] = useState({
    name: currentShift?.cashierName || '',
    email: '',
    phone: '',
    staffId: '',
    role: '',
    branch: '',
    shift: currentShift?.shiftTime || '',
    accountStatus: '',
  })
  const displayName = profile.name || 'Profile belum diisi'
  const displayRole = profile.role || 'Role belum diisi'
  const displayBranch = profile.branch || 'Cabang belum diisi'
  const displayShift = profile.shift || currentShift?.shiftTime || 'Shift belum diisi'
  const configuredAccessCount = [
    profile.role,
    profile.branch,
    profile.shift,
    profile.accountStatus,
  ].filter(Boolean).length
  const initials = (profile.name || 'P')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="profile-page">
      <Sidebar
        activePage="profile"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
        profileName={currentShift?.cashierName}
      />

      <section className="profile-content">
        <PageHeader
          eyebrow="Profile"
          title="Pengaturan profile kasir"
          description="Atur identitas akun, cabang kerja, role, dan informasi shift pengguna."
          actions={<Button type="button" onClick={onDashboard}>Kembali</Button>}
        />

        <section className="profile-overview">
          <div className="profile-photo">{initials}</div>
          <div>
            <h2>{displayName}</h2>
            <span>{displayRole}</span>
            <small>{displayBranch} - Shift {displayShift}</small>
          </div>
          <div className="profile-access-score">
            <strong>{configuredAccessCount}/4</strong>
            <span>Kelengkapan akses</span>
          </div>
        </section>

        <section className="profile-grid">
          <article className="profile-panel">
            <div className="profile-panel-header">
              <p>Data Profile</p>
              <h2>Informasi pengguna</h2>
            </div>

            <form className="profile-form">
              <label>
                Nama Lengkap
                <Input
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
              </label>
              <label>
                Email
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                />
              </label>
              <label>
                Nomor Telepon
                <Input
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </label>
              <label>
                ID Staff
                <Input
                  value={profile.staffId}
                  onChange={(event) => setProfile({ ...profile, staffId: event.target.value })}
                />
              </label>
              <Button variant="primary" type="button">Simpan Profile</Button>
            </form>
          </article>

          <article className="profile-panel">
            <div className="profile-panel-header">
              <p>Akses Akun</p>
              <h2>Role dan operasional</h2>
            </div>

            <div className="profile-detail-list">
              <label>
                Role
                <Select
                  value={profile.role}
                  onChange={(event) => setProfile({ ...profile, role: event.target.value })}
                >
                  <option value="">Pilih role</option>
                  <option>Kasir Utama</option>
                  <option>Admin Toko</option>
                  <option>Supervisor</option>
                </Select>
              </label>
              <label>
                Cabang
                <Select
                  value={profile.branch}
                  onChange={(event) => setProfile({ ...profile, branch: event.target.value })}
                >
                  <option value="">Pilih cabang</option>
                  <option>Cabang Utama</option>
                  <option>Cabang Barat</option>
                  <option>Cabang Timur</option>
                </Select>
              </label>
              <label>
                Shift
                <Select
                  value={profile.shift}
                  onChange={(event) => setProfile({ ...profile, shift: event.target.value })}
                >
                  <option value="">Pilih shift</option>
                  <option>08:00 - 16:00</option>
                  <option>16:00 - 22:00</option>
                  <option>22:00 - 06:00</option>
                </Select>
              </label>
              <label>
                Status Akun
                <Select
                  value={profile.accountStatus}
                  onChange={(event) => setProfile({ ...profile, accountStatus: event.target.value })}
                >
                  <option value="">Pilih status</option>
                  <option>Aktif</option>
                  <option>Nonaktif</option>
                  <option>Ditahan sementara</option>
                </Select>
              </label>
            </div>
          </article>

          <article className="profile-panel profile-danger">
            <div className="profile-panel-header">
              <p>Session</p>
              <h2>Keluar dari akun</h2>
            </div>
            <span>
              {isShiftOpen
                ? 'Untuk logout dengan aman, tutup shift kasir yang sedang berjalan terlebih dahulu.'
                : 'Shift sudah selesai. Kamu bisa logout dan kembali ke halaman login.'}
            </span>
            {showLogoutReminder && isShiftOpen && (
              <div className="logout-reminder">
                <strong>Shift masih aktif</strong>
                <span>Silakan masuk ke halaman Shift, klik End Shift, lalu logout setelah shift selesai.</span>
              </div>
            )}
            <div className="profile-session-actions">
              <Button
                type="button"
                onClick={() => {
                  if (isShiftOpen) {
                    setShowLogoutReminder(true)
                    return
                  }

                  onLogout()
                }}
              >
                Logout
              </Button>
              {isShiftOpen && (
                <Button className="end-shift-button" type="button" onClick={onShift}>Ke End Shift</Button>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
