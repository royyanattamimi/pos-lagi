import { supabase } from '../lib/supabase'

export type UserProfile = {
  name: string
  email: string
  phone: string
  staffId: string
  role: string
  branch: string
  shift: string
  address: string
  notes: string
}

export const emptyProfile: UserProfile = {
  name: '', email: '', phone: '', staffId: '', role: '', branch: '', shift: '', address: '', notes: '',
}

export async function loadProfile(accountId: string): Promise<UserProfile> {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const { data, error } = await supabase.from('user_profiles').select('data').eq('user_id', accountId).maybeSingle()
  if (error) throw new Error(`Gagal memuat profil: ${error.message}`)
  if (!data) {
    // Old profiles were already scoped to the authenticated account.
    let legacy: unknown
    try { legacy = JSON.parse(localStorage.getItem(`pos-lagi:profile:v1:${accountId}`) || 'null') } catch { /* no legacy profile */ }
    if (legacy && typeof legacy === 'object') {
      const profile = normalizeProfile(legacy)
      await saveProfile(accountId, profile)
      return profile
    }
  }
  return normalizeProfile(data?.data)
}

export async function saveProfile(accountId: string, profile: UserProfile) {
  if (!supabase) throw new Error('Database belum dikonfigurasi.')
  const { error } = await supabase.from('user_profiles').upsert({ user_id: accountId, data: profile })
  if (error) throw new Error(`Profil belum tersimpan: ${error.message}`)
}

export function normalizeProfile(value: unknown): UserProfile {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return Object.fromEntries(Object.entries(emptyProfile).map(([key, fallback]) => [
    key, typeof record[key] === 'string' ? record[key] : fallback,
  ])) as UserProfile
}
