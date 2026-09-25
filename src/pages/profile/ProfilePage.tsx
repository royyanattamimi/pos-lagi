import { useState, type FormEvent } from 'react'
import { Save, RotateCcw, UserRound, Settings } from 'lucide-react'
import { useProfile } from '../../context/useProfile'
import type { UserProfile } from '../../storage/profileStorage'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import type { ShiftSession } from '../../types'

type ProfilePageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onPaidTransactions: () => void
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
  onPaidTransactions,
  onShift,
  onProfile,
  onLogout,
  isShiftOpen,
  currentShift,
}: ProfilePageProps) {
  const [showLogoutReminder, setShowLogoutReminder] = useState(false)
  const { profile: savedProfile, updateProfile } = useProfile()
  const initialProfile = {
    ...savedProfile,
    name: savedProfile.name || currentShift?.cashierName || '',
    shift: savedProfile.shift || currentShift?.shiftTime || '',
  }
  const [profile, setProfile] = useState(initialProfile)
  const [baseline, setBaseline] = useState(initialProfile)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isDirty = JSON.stringify(profile) !== JSON.stringify(baseline)
  const configuredFields = [profile.name, profile.email, profile.phone, profile.staffId, profile.role, profile.branch]
  const completed = configuredFields.filter((value) => value.trim()).length
  const initials = (profile.name.trim() || 'P').split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()

  function edit(field: keyof UserProfile, value: string) {
    setProfile((previous) => ({ ...previous, [field]: value }))
    setMessage('')
    setError('')
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!profile.name.trim()) {
      setError('Nama lengkap wajib diisi.')
      return
    }
    const next = Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, value.trim()])) as UserProfile
    setSaving(true)
    try {
      await updateProfile(next)
      setProfile(next)
      setBaseline(next)
      setError('')
      setMessage('Profil berhasil disimpan di database.')
    } catch (failure) {
      setMessage('')
      setError(failure instanceof Error ? failure.message : 'Profil belum tersimpan. Periksa koneksi dan coba lagi.')
    } finally { setSaving(false) }
  }

  return (
    <main className="profile-page app-shell">
      <Sidebar
        activePage="profile"
        onDashboard={onDashboard}
        onProduct={onProduct}
        onTransaction={onTransaction} onPaidTransactions={onPaidTransactions}
        onShift={onShift}
        onProfile={onProfile}
        profileName={currentShift?.cashierName}
      />

      <section className="profile-content content-shell">
        <PageHeader
          eyebrow="Profil"
          title="Pengaturan profil"
          description="Lengkapi identitas dan pengaturan kerja, lalu simpan perubahan Anda."
          actions={<Button type="button" onClick={onDashboard}>Kembali ke dashboard</Button>}
        />

        <section className="mb-5 flex flex-wrap items-center gap-5 surface-panel">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-teal-100 text-2xl font-black text-teal-800" aria-hidden="true">{initials}</div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-semibold">{profile.name || 'Nama belum diisi'}</h2>
            <p className="text-sm text-slate-500">{profile.role || 'Jabatan belum diisi'} · {profile.branch || 'Cabang belum diisi'}</p>
            <p className="mt-1 text-xs text-slate-500">Pratinjau profil · {completed} dari 6 informasi utama terisi</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{isDirty ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan'}</span>
        </section>

        <form onSubmit={handleSave} className="mb-5 grid gap-5">
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <section className="surface-panel">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><UserRound size={20} aria-hidden="true" /> Informasi pribadi</h2>
              <p className="mb-5 text-sm text-slate-500">Nama wajib diisi. Informasi lainnya dapat dilengkapi nanti.</p>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">Nama lengkap *
                  <Input required maxLength={100} autoComplete="name" placeholder="Contoh: Budi Santoso" value={profile.name} onChange={(event) => edit('name', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Email kontak
                  <Input type="email" maxLength={254} autoComplete="email" placeholder="nama@contoh.com" value={profile.email} onChange={(event) => edit('email', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">Untuk informasi kontak; tidak mengubah email login.</span>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Nomor telepon
                  <Input type="tel" maxLength={25} autoComplete="tel" placeholder="Contoh: 0812 3456 7890" value={profile.phone} onChange={(event) => edit('phone', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Alamat
                  <textarea className="rounded-lg border border-slate-200 p-3 font-normal focus:outline-teal-600" rows={3} maxLength={500} autoComplete="street-address" placeholder="Alamat kontak (opsional)" value={profile.address} onChange={(event) => edit('address', event.target.value)} />
                </label>
              </div>
            </section>

            <section className="surface-panel">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><Settings size={20} aria-hidden="true" /> Pengaturan kerja</h2>
              <p className="mb-5 text-sm text-slate-500">Informasi profil kerja. Tidak mengubah hak akses atau shift yang sedang berjalan.</p>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">ID staf
                  <Input maxLength={50} placeholder="Contoh: KSR-001" value={profile.staffId} onChange={(event) => edit('staffId', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Jabatan
                  <Select value={profile.role} onChange={(event) => edit('role', event.target.value)}>
                    <option value="">Pilih jabatan</option>
                    <option>Kasir Utama</option><option>Admin Toko</option><option>Supervisor</option>
                  </Select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Nama cabang
                  <Input maxLength={100} placeholder="Contoh: Cabang Utama" value={profile.branch} onChange={(event) => edit('branch', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Jadwal kerja preferensi
                  <Input maxLength={100} placeholder="Contoh: 08:00 - 16:00" value={profile.shift} onChange={(event) => edit('shift', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Catatan profil
                  <textarea className="rounded-lg border border-slate-200 p-3 font-normal focus:outline-teal-600" rows={3} maxLength={500} placeholder="Informasi tambahan (opsional)" value={profile.notes} onChange={(event) => edit('notes', event.target.value)} />
                </label>
              </div>
            </section>
          </div>

          <div className="surface-panel">
            {message && <p role="status" className="mb-3 text-sm font-semibold text-emerald-700">{message}</p>}
            {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">Profil tersimpan di database dan dapat dibuka melalui akun yang sama di perangkat lain.</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!isDirty || saving} onClick={() => { setProfile({ ...baseline }); setMessage('Perubahan dibatalkan.'); setError('') }}>
                  <RotateCcw aria-hidden="true" /> Batalkan perubahan
                </Button>
                <Button variant="primary" type="submit" disabled={saving}><Save aria-hidden="true" /> Simpan profil</Button>
              </div>
            </div>
          </div>
        </form>

        <section className="profile-grid grid gap-5">
          <article className="profile-panel profile-danger rounded-lg border border-red-200 bg-white p-5 shadow-lg shadow-red-900/5">
            <div className="profile-panel-header mb-4 border-b border-slate-100 pb-4 [&_p]:mb-1 [&_p]:text-xs [&_p]:font-black [&_p]:uppercase [&_p]:text-teal-700 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-black">
              <p>Session</p>
              <h2>Keluar dari akun</h2>
            </div>
            <span>
              {isShiftOpen
                ? 'Untuk logout dengan aman, tutup shift kasir yang sedang berjalan terlebih dahulu.'
                : 'Shift sudah selesai. Kamu bisa logout dan kembali ke halaman login.'}
            </span>
            {showLogoutReminder && isShiftOpen && (
              <div className="logout-reminder rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Shift masih aktif</strong>
                <span>Silakan masuk ke halaman Shift, klik End Shift, lalu logout setelah shift selesai.</span>
              </div>
            )}
            <div className="profile-session-actions mt-4 flex flex-wrap gap-2">
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
