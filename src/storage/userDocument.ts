import { supabase } from '../lib/supabase'

export async function loadUserDocument(accountId: string): Promise<Record<string, unknown> | null> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const { data, error } = await supabase.from('user_profiles').select('data').eq('user_id', accountId).maybeSingle()
  if (error) throw new Error(`Gagal memuat pengaturan akun: ${error.message}`)
  return data?.data ?? null
}

// Preserve other sections of the account document, including changes made on another device.
export async function patchUserDocument(accountId: string, patch: Record<string, unknown>) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const previous = await loadUserDocument(accountId)
    const data = { ...previous, ...patch }
    if (previous === null) {
      const { error } = await supabase.from('user_profiles').insert({ user_id: accountId, data })
      if (!error) return
      if (error.code === '23505') continue
      throw new Error(`Pengaturan belum tersimpan: ${error.message}`)
    }
    const { data: saved, error } = await supabase.from('user_profiles').update({ data })
      .eq('user_id', accountId).eq('data', JSON.stringify(previous)).select('user_id')
    if (error) throw new Error(`Pengaturan belum tersimpan: ${error.message}`)
    if (saved?.length) return
  }
  throw new Error('Data akun sedang berubah di perangkat lain. Coba simpan kembali.')
}
