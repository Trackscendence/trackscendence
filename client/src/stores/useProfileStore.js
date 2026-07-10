import { createProfileActions } from './profileStore.actions'
import { createSessionStore } from './createSessionStore'

const getDefaultState = () => ({
  currentProfile: null,
  publicProfile: null,
  relationship: null,
  friends: [],
  leaderboard: [],
  isLoading: false,
  isSubmitting: false,
  error: '',
  actionError: '',
})

// Session store (#391): holds the signed-in user's profile, friends list, and
// viewed profiles, so it is cleared by resetSessionStores() at teardown. The
// loaders and actions guard their post-await writes against a stale session.
const useProfileStore = createSessionStore((set, get) => ({
  ...getDefaultState(),
  ...createProfileActions(set, get),
  reset: () => set(getDefaultState()),
}))

export default useProfileStore
