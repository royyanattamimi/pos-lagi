import { useState, type ComponentProps, type FormEvent } from 'react'
import { Save, RotateCcw, Store, ReceiptText, SlidersHorizontal } from 'lucide-react'
import { Sidebar } from '../../component/sidebar/Sidebar'
import { PageHeader } from '../../component/header/PageHeader'
import { Button } from '../../component/button/Button'
import { Input } from '../../component/input/Input'
import { Select } from '../../component/select/Select'
import { useProfile } from '../../context/useProfile'
import { defaultSettings, normalizeSettings, type AppSettings } from '../../storage/settingsStorage'

type Props = Omit<ComponentProps<typeof Sidebar>, 'activePage'> & {
  onSaved: (settings: AppSettings) => void
}

export function SettingsPage({ onSaved, ...navigation }: Props) {
  const { settings, updateSettings, profile } = useProfile()
  const [draft, setDraft] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  function edit<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setError(''); setMessage('')
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!draft.storeName.trim()) { setError('Nama toko wajib diisi.'); return }
    setSaving(true); setError(''); setMessage('')
    try {
      const next = normalizeSettings(draft)
      await updateSettings(next)
      setDraft(next)
      onSaved(next)
      setMessage('Pengaturan berhasil disimpan dan diterapkan untuk akun ini.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Pengaturan belum tersimpan. Coba lagi.')
    } finally { setSaving(false) }
  }
  return (
    <main className="settings-page app-shell">
      <Sidebar activePage="settings" {...navigation} />
      <section className="content-shell">
        <PageHeader eyebrow="Preferensi akun" title="Pengaturan" description="Sesuaikan nota dan cara kerja kasir. Pengaturan tersimpan untuk akun ini dan berlaku di perangkat lain setelah login atau muat ulang." />
        <form onSubmit={save} className="grid gap-5">
          <fieldset disabled={saving} className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5">
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><Store size={20} /> Identitas toko pada nota</h2>
                <p className="mb-4 text-sm text-slate-500">Nama toko juga tampil di sidebar. Pengaturan ini berlaku untuk akun Anda.</p>
                <div className="grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-bold">
                  <label>Nama toko<Input required maxLength={80} value={draft.storeName} onChange={(event) => edit('storeName', event.target.value)} /></label>
                  <label>Alamat toko<textarea rows={3} maxLength={250} value={draft.storeAddress} onChange={(event) => edit('storeAddress', event.target.value)} placeholder="Alamat yang dicetak pada nota" /></label>
                  <label>Telepon toko<Input type="tel" maxLength={30} value={draft.storePhone} onChange={(event) => edit('storePhone', event.target.value)} placeholder="Contoh: 0812 3456 7890" /></label>
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ReceiptText size={20} /> Nota & pencetakan</h2>
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-bold">Ukuran kertas nota<Select value={draft.receiptPaper} onChange={(event) => edit('receiptPaper', event.target.value as AppSettings['receiptPaper'])}><option value="80">80 mm</option><option value="58">58 mm</option></Select></label>
                  <label className="grid gap-2 text-sm font-bold">Pesan penutup nota<textarea rows={3} maxLength={200} value={draft.receiptFooter} onChange={(event) => edit('receiptFooter', event.target.value)} /></label>
                  <Toggle label="Tampilkan nama kasir pada nota" description="Nama kasir tetap tersimpan dalam transaksi dan laporan." checked={draft.showCashierOnReceipt} onChange={(value) => edit('showCashierOnReceipt', value)} />
                  <Toggle label="Cetak catatan produk" description="Tampilkan permintaan pelanggan, seperti tanpa gula atau saus dipisah." checked={draft.showNotesOnReceipt} onChange={(value) => edit('showNotesOnReceipt', value)} />
                  <p className="text-xs text-slate-500">Saat mencetak, pilih ukuran kertas yang sama pada pengaturan printer.</p>
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><SlidersHorizontal size={20} /> Transaksi & dashboard</h2>
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-bold">Metode pembayaran awal<Select value={draft.defaultPaymentMethod} onChange={(event) => edit('defaultPaymentMethod', event.target.value as AppSettings['defaultPaymentMethod'])}>{['Cash', 'QRIS', 'Debit'].map((method) => <option key={method}>{method}</option>)}</Select><small className="font-normal text-slate-500">Dipilih otomatis pada transaksi baru. Kasir tetap bisa menggantinya saat pembayaran.</small></label>
                  <Toggle label="Tampilkan foto produk di halaman transaksi" description="Matikan agar daftar menu lebih ringkas." checked={draft.showProductImages} onChange={(value) => edit('showProductImages', value)} />
                  <label className="grid gap-2 text-sm font-bold">Periode awal grafik penjualan<Select value={draft.defaultSalesPeriod} onChange={(event) => edit('defaultSalesPeriod', event.target.value as AppSettings['defaultSalesPeriod'])}><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></Select></label>
                </div>
              </section>
            </div>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-6">
              <h2 className="mb-1 font-bold">Preview nota</h2><p className="mb-4 text-xs text-slate-500">Contoh tampilan · Kertas {draft.receiptPaper} mm</p>
              <div className={`mx-auto border border-dashed border-slate-300 p-4 font-mono text-xs ${draft.receiptPaper === '58' ? 'max-w-52' : 'w-full'}`}>
                <div className="mb-4 text-center"><strong className="block break-words text-lg">{draft.storeName || 'Nama toko'}</strong><p>{profile.branch || 'Cabang Utama'}</p><p className="whitespace-pre-wrap break-words">{draft.storeAddress}</p><p>{draft.storePhone}</p></div>
                {draft.showCashierOnReceipt && <p>Kasir: {profile.name || 'Kasir'}</p>}
                <div className="my-3 border-y border-dashed border-slate-300 py-3"><strong>Kopi susu</strong><p>1 × Rp 20.000</p>{draft.showNotesOnReceipt && <p>Catatan: tanpa gula</p>}</div>
                <p className="flex justify-between font-bold"><span>TOTAL</span><span>Rp 20.000</span></p>
                <p className="mt-4 whitespace-pre-wrap break-words text-center">{draft.receiptFooter}</p>
              </div>
            </aside>
          </fieldset>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
            {message && <p role="status" className="mb-3 text-sm text-teal-700">{message}</p>}
            {dirty && <p className="mb-3 text-sm text-amber-700">Ada perubahan yang belum disimpan.</p>}
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" type="submit" disabled={saving || !dirty}><Save /> {saving ? 'Menyimpan…' : 'Simpan pengaturan'}</Button>
              <Button disabled={saving || !dirty} onClick={() => { setDraft({ ...settings }); setError(''); setMessage('Perubahan dibatalkan.') }}>Batalkan perubahan</Button>
              <Button variant="ghost" disabled={saving} onClick={() => { setDraft({ ...defaultSettings }); setError(''); setMessage('Nilai awal dimuat. Klik Simpan pengaturan untuk menerapkan.') }}><RotateCcw /> Kembalikan nilai awal</Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3"><span><strong className="block text-sm">{label}</strong><span className="text-xs text-slate-500">{description}</span></span><input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" /></label>
}
