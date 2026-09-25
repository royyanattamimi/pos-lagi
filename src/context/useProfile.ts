import { createContext, useContext } from 'react'
import { emptyProfile, type UserProfile } from '../storage/profileStorage'

export const ProfileContext = createContext({
  profile: emptyProfile,
  updateProfile: async (_profile: UserProfile): Promise<void> => {},
})

export function useProfile() {
  return useContext(ProfileContext)
}
