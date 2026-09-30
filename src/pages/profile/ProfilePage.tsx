import { useState, type FormEvent } from 'react'
import { Save, RotateCcw, Building2 } from 'lucide-react'
import { useProfile } from '../../context/useProfile'
import type { UserProfile } from '../../storage/profileStorage'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Select } from '../../component/select/Select'
import { Input } from '../../component/input/Input'
import type { ShiftSession } from '../../types'

type ProfilePageProps = {
  onDashboard: () => void
  onProduct: () => void
  onTransaction: () => void
  onPaidTransactions: () => void
  onShift: () => void
  onSettings: () => void
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
  onSettings,
  onProfile,
  onLogout,
  isShiftOpen,
  currentShift,
}: ProfilePageProps) {
  const [showLogoutReminder, setShowLogoutReminder] = useState(false)
  const { profile: savedProfile, updateProfile } = useProfile()
  const initialProfile = { ...savedProfile }
  const [profile, setProfile] = useState(initialProfile)
  const [baseline, setBaseline] = useState(initialProfile)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isDirty = JSON.stringify(profile) !== JSON.stringify(baseline)
  const configuredFields = [profile.companyName, profile.companyEmail, profile.companyPhone, profile.companyAddress, profile.companyCity, profile.companyPostalCode]
  const completed = configuredFields.filter((value) => value.trim()).length
  const initials = (profile.companyName.trim() || 'C').split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()

  function edit(field: keyof UserProfile, value: string) {
    setProfile((previous) => ({ ...previous, [field]: value }))
    setMessage('')
    setError('')
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!profile.companyName.trim()) {
      setError('Nama company / usaha wajib diisi.')
      return
    }
    const next = Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, value.trim()])) as UserProfile
    setSaving(true)
    try {
      await updateProfile(next)
      setProfile(next)
      setBaseline(next)
      setError('')
      setMessage('Informasi company berhasil disimpan.')
    } catch (failure) {
      setMessage('')
      setError(failure instanceof Error ? failure.message : 'Informasi company belum tersimpan. Periksa koneksi dan coba lagi.')
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
        onSettings={onSettings} onProfile={onProfile}
        profileName={currentShift?.cashierName}
      />

      <section className="profile-content content-shell">
        <PageHeader
          eyebrow="Company"
          title="Pengaturan company"
          description="Kelola identitas, kontak, lokasi, dan informasi operasional usaha Anda."
          actions={<Button type="button" onClick={onDashboard}>Kembali ke dashboard</Button>}
        />

        <section className="mb-5 flex flex-wrap items-center gap-5 surface-panel">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-teal-100 text-2xl font-black text-teal-800" aria-hidden="true">{initials}</div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-semibold">{profile.companyName || 'Nama usaha belum diisi'}</h2>
            <p className="text-sm text-slate-500">{profile.companyEmail || 'Email belum diisi'} · {profile.companyPhone || 'Nomor telepon belum diisi'}</p>
            <p className="mt-1 text-xs text-slate-500">Pratinjau company · {completed} dari 6 informasi utama terisi</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{isDirty ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan'}</span>
        </section>

        <form onSubmit={handleSave} className="mb-5 grid gap-5">
          <section className="surface-panel">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><Building2 size={20} aria-hidden="true" /> Informasi Company</h2>
            <p className="mb-5 text-sm text-slate-500">Lengkapi data usaha seperti coffee shop, kafe, atau toko Anda. Hanya nama company / usaha yang wajib diisi.</p>
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <fieldset className="grid min-w-0 gap-4">
                <legend className="mb-4 text-base font-semibold">Identitas usaha</legend>
                <label className="grid gap-2 text-sm font-semibold">Nama company / usaha *
                  <Input required maxLength={100} autoComplete="organization" placeholder="Contoh: Kopi Senja" value={profile.companyName} onChange={(event) => edit('companyName', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">Nama brand atau usaha yang ditampilkan pada profil company.</span>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Jenis usaha
                  <Select value={profile.businessType} onChange={(event) => edit('businessType', event.target.value)}>
                    <option value="">Pilih jenis usaha</option>
                    <option>Coffee Shop</option><option>Kafe</option><option>Restoran</option><option>Bakery</option><option>Usaha Minuman</option><option>Retail</option><option>Lainnya</option>
                  </Select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Nama badan usaha
                  <Input maxLength={150} placeholder="Contoh: PT Kopi Senja Indonesia" value={profile.companyLegalName} onChange={(event) => edit('companyLegalName', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">Opsional, isi jika usaha terdaftar atas nama PT, CV, atau badan usaha lainnya.</span>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Nama outlet / cabang
                  <Input maxLength={100} placeholder="Contoh: Kopi Senja — Kemang" value={profile.companyBranch} onChange={(event) => edit('companyBranch', event.target.value)} />
                </label>
              </fieldset>
              <fieldset className="grid min-w-0 gap-4">
                <legend className="mb-4 text-base font-semibold">Kontak bisnis</legend>
                <label className="grid gap-2 text-sm font-semibold">Email bisnis
                  <Input type="email" maxLength={254} placeholder="halo@kopisenja.com" value={profile.companyEmail} onChange={(event) => edit('companyEmail', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">Email yang dapat dihubungi pelanggan atau mitra; tidak mengubah email login.</span>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Telepon / WhatsApp bisnis
                  <Input type="tel" maxLength={25} placeholder="Contoh: +62 812 3456 7890" value={profile.companyPhone} onChange={(event) => edit('companyPhone', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Website
                  <Input type="url" maxLength={300} placeholder="https://kopisenja.com" value={profile.companyWebsite} onChange={(event) => edit('companyWebsite', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Instagram usaha
                  <Input maxLength={100} placeholder="Contoh: @kopisenja" value={profile.companyInstagram} onChange={(event) => edit('companyInstagram', event.target.value)} />
                </label>
              </fieldset>
              <fieldset className="grid min-w-0 gap-4">
                <legend className="mb-4 text-base font-semibold">Lokasi usaha</legend>
                <label className="grid gap-2 text-sm font-semibold">Alamat outlet
                  <textarea className="rounded-lg border border-slate-200 p-3 font-normal focus:outline-teal-600" rows={3} maxLength={500} placeholder="Nama jalan, nomor bangunan, kelurahan, dan kecamatan" value={profile.companyAddress} onChange={(event) => edit('companyAddress', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Kota / kabupaten
                  <Input maxLength={100} placeholder="Contoh: Jakarta Selatan" value={profile.companyCity} onChange={(event) => edit('companyCity', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Provinsi
                  <Input maxLength={100} placeholder="Contoh: DKI Jakarta" value={profile.companyProvince} onChange={(event) => edit('companyProvince', event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Kode pos
                  <Input maxLength={10} placeholder="Contoh: 12730" value={profile.companyPostalCode} onChange={(event) => edit('companyPostalCode', event.target.value)} />
                </label>
              </fieldset>
              <fieldset className="grid min-w-0 gap-4">
                <legend className="mb-4 text-base font-semibold">Operasional dan deskripsi</legend>
                <label className="grid gap-2 text-sm font-semibold">Hari dan jam operasional
                  <Input maxLength={300} placeholder="Contoh: Senin–Jumat 08.00–22.00; Sabtu–Minggu 09.00–23.00" value={profile.companyOperatingHours} onChange={(event) => edit('companyOperatingHours', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">Cantumkan hari buka, jam buka dan tutup, serta jadwal khusus jika ada.</span>
                </label>
                <label className="grid gap-2 text-sm font-semibold">Deskripsi usaha
                  <textarea className="rounded-lg border border-slate-200 p-3 font-normal focus:outline-teal-600" rows={5} maxLength={500} placeholder="Contoh: Coffee shop dengan kopi lokal, pastry, area kerja, dan layanan takeaway." value={profile.companyDescription} onChange={(event) => edit('companyDescription', event.target.value)} />
                  <span className="text-xs font-normal text-slate-500">{profile.companyDescription.length}/500 karakter</span>
                </label>
              </fieldset>
            </div>
          </section>

          <div className="surface-panel">
            {message && <p role="status" className="mb-3 text-sm font-semibold text-emerald-700">{message}</p>}
            {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">Informasi company tersimpan di database dan dapat dibuka melalui akun yang sama di perangkat lain.</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!isDirty || saving} onClick={() => { setProfile({ ...baseline }); setMessage('Perubahan dibatalkan.'); setError('') }}>
                  <RotateCcw aria-hidden="true" /> Batalkan perubahan
                </Button>
                <Button variant="primary" type="submit" disabled={saving}><Save aria-hidden="true" /> Simpan company</Button>
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
