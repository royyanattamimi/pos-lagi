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

export function loadProfile(accountId: string): UserProfile {
  try {
    const value = JSON.parse(localStorage.getItem(`pos-lagi:profile:v1:${accountId}`) || '{}')
    return Object.fromEntries(Object.entries(emptyProfile).map(([key, fallback]) => [
      key, typeof value?.[key] === 'string' ? value[key] : fallback,
    ])) as UserProfile
  } catch {
    return { ...emptyProfile }
  }
}

export function saveProfile(accountId: string, profile: UserProfile) {
  localStorage.setItem(`pos-lagi:profile:v1:${accountId}`, JSON.stringify(profile))
}
