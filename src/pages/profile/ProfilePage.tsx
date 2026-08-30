import { useState } from 'react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import './ProfilePage.css'

type ProfilePageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onShift: () => void
  onProfile: () => void
  onLogout: () => void
  isShiftOpen: boolean
}

export function ProfilePage({
  onDashboard,
  onProduct,
  onTransaction,
  onShift,
  onProfile,
  onLogout,
  isShiftOpen,
}: ProfilePageProps) {
  const [showLogoutReminder, setShowLogoutReminder] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Admin Kasir',
    email: 'admin@poslagi.com',
    phone: '0812-3456-7890',
    role: 'Kasir Utama',
    branch: 'Cabang Utama',
    shift: '08:00 - 16:00',
  })

  return (
    <main className="profile-page">
      <Sidebar
        activePage="profile"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction}
        onShift={onShift}
        onProfile={onProfile}
      />

      <section className="profile-content">
        <header className="profile-header">
          <div>
            <p>Profile</p>
            <h1>Pengaturan profile kasir</h1>
            <span>Atur identitas akun, cabang kerja, role, dan informasi shift pengguna.</span>
          </div>
          <button type="button" onClick={onDashboard}>Kembali</button>
        </header>

        <section className="profile-overview">
          <div className="profile-photo">AK</div>
          <div>
            <h2>{profile.name}</h2>
            <span>{profile.role}</span>
            <small>{profile.branch} - Shift {profile.shift}</small>
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
                <input
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                />
              </label>
              <label>
                Nomor Telepon
                <input
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </label>
              <button type="button">Simpan Profile</button>
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
                <select
                  value={profile.role}
                  onChange={(event) => setProfile({ ...profile, role: event.target.value })}
                >
                  <option>Kasir Utama</option>
                  <option>Admin Toko</option>
                  <option>Supervisor</option>
                </select>
              </label>
              <label>
                Cabang
                <select
                  value={profile.branch}
                  onChange={(event) => setProfile({ ...profile, branch: event.target.value })}
                >
                  <option>Cabang Utama</option>
                  <option>Cabang Barat</option>
                  <option>Cabang Timur</option>
                </select>
              </label>
              <label>
                Shift
                <select
                  value={profile.shift}
                  onChange={(event) => setProfile({ ...profile, shift: event.target.value })}
                >
                  <option>08:00 - 16:00</option>
                  <option>16:00 - 22:00</option>
                  <option>22:00 - 06:00</option>
                </select>
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
              <button
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
              </button>
              {isShiftOpen && (
                <button className="end-shift-button" type="button" onClick={onShift}>Ke End Shift</button>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
