import { useState, type ReactNode } from 'react'
import { ProfileContext } from './useProfile'
import { loadProfile, saveProfile, type UserProfile } from '../storage/profileStorage'

export function ProfileProvider({ accountId, children }: { accountId: string; children: ReactNode }) {
  const [profile, setProfile] = useState(() => loadProfile(accountId))
  function updateProfile(next: UserProfile) {
    saveProfile(accountId, next)
    setProfile(next)
  }
  return <ProfileContext.Provider value={{ profile, updateProfile }}>{children}</ProfileContext.Provider>
}

