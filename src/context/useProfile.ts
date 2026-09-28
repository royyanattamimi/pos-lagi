import { defaultSettings, type AppSettings } from '../storage/settingsStorage'
import { createContext, useContext } from 'react'
import { emptyProfile, type UserProfile } from '../storage/profileStorage'

export const ProfileContext = createContext({
  profile: emptyProfile,
  settings: defaultSettings,
  updateSettings: async (_settings: AppSettings): Promise<void> => {},
  updateProfile: async (_profile: UserProfile): Promise<void> => {},
})

export function useProfile() {
  return useContext(ProfileContext)
}
