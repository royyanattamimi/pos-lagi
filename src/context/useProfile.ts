import { createContext, useContext } from 'react'
import { emptyProfile, type UserProfile } from '../storage/profileStorage'

export const ProfileContext = createContext({
  profile: emptyProfile,
  updateProfile: (_profile: UserProfile) => {},
})

export function useProfile() {
  return useContext(ProfileContext)
}
