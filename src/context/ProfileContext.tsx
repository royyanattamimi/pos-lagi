import { useEffect, useState, type ReactNode } from 'react'
import { ProfileContext } from './useProfile'
import { emptyProfile, loadProfile, saveProfile, type UserProfile } from '../storage/profileStorage'
import { Button } from '../component/button/Button'

export function ProfileProvider({ accountId, children }: { accountId: string; children: ReactNode }) {
  const [profile, setProfile] = useState(emptyProfile)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadProfile(accountId).then((next) => {
      if (!cancelled) { setProfile(next); setReady(true) }
    }).catch((failure) => { if (!cancelled) setError(failure.message) })
    return () => { cancelled = true }
  }, [accountId, retry])
  async function updateProfile(next: UserProfile) {
    await saveProfile(accountId, next)
    setProfile(next)
  }
  if (!ready) return <main className="min-h-screen grid place-items-center bg-slate-100 p-6"><div>
    <p role={error ? 'alert' : 'status'}>{error || 'Memuat profil…'}</p>
    {error && <Button onClick={() => { setError(''); setRetry((value) => value + 1) }}>Coba lagi</Button>}
  </div></main>
  return <ProfileContext.Provider value={{ profile, updateProfile }}>{children}</ProfileContext.Provider>
}
