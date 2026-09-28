import { useEffect, useState, type ReactNode } from 'react'
import { ProfileContext } from './useProfile'
import { emptyProfile, loadProfile, saveProfile, type UserProfile } from '../storage/profileStorage'
import { defaultSettings, loadSettings, saveSettings, type AppSettings } from '../storage/settingsStorage'
import { Button } from '../component/button/Button'

export function ProfileProvider({ accountId, children }: { accountId: string; children: ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [profile, setProfile] = useState(emptyProfile)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    Promise.all([loadProfile(accountId), loadSettings(accountId)]).then(([next, preferences]) => {
      if (!cancelled) { setProfile(next); setSettings(preferences); setReady(true) }
    }).catch((failure) => { if (!cancelled) setError(failure.message) })
    return () => { cancelled = true }
  }, [accountId, retry])
  async function updateProfile(next: UserProfile) {
    await saveProfile(accountId, next)
    setProfile(next)
  }
  async function updateSettings(next: AppSettings) {
    const saved = await saveSettings(accountId, next)
    setSettings(saved)
  }
  if (!ready) return <main className="min-h-screen grid place-items-center bg-slate-100 p-6"><div>
    <p role={error ? 'alert' : 'status'}>{error || 'Memuat profil…'}</p>
    {error && <Button onClick={() => { setError(''); setRetry((value) => value + 1) }}>Coba lagi</Button>}
  </div></main>
  return <ProfileContext.Provider value={{ profile, updateProfile, settings, updateSettings }}>{children}</ProfileContext.Provider>
}
