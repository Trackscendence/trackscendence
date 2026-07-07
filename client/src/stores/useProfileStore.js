import { create } from 'zustand'
import { createProfileActions } from './profileStore.actions'

const useProfileStore = create((set, get) => ({
  currentProfile: null,
  publicProfile: null,
  relationship: null,
  friends: [],
  leaderboard: [],
  isLoading: false,
  isSubmitting: false,
  error: '',
  actionError: '',
  ...createProfileActions(set, get),
}))

export default useProfileStore
