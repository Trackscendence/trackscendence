import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import {
  fetchUserProfile,
  updateCurrentUserProfile,
} from '@/services/users'

const joinedDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
})

const matchDateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const buildAvatarLabel = (displayName, username) => {
  const labelSource = (displayName || username || '').trim()

  if (!labelSource) {
    return 'TS'
  }

  const words = labelSource.split(/\s+/).filter(Boolean)

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }

  return labelSource.slice(0, 2).toUpperCase()
}

const getResultPalette = (result) => {
  if (result === 'WIN') {
    return 'border-[#bbd2c3] bg-[#eef7f1] text-[#24563f]'
  }

  if (result === 'LOSS') {
    return 'border-[#e2a496] bg-[#fff1ed] text-[#8a321f]'
  }

  return 'border-[#d9dfd3] bg-[#f3f6f1] text-[#52645a]'
}

const formatRank = (rank) => {
  return Number.isInteger(rank) ? `#${rank}` : 'Unranked'
}

const ProfilePage = () => {
  const navigate = useNavigate()
  const { username: routeUsername } = useParams()
  const { token, updateUser, user } = useAuthStore()
  const profileUsername = routeUsername || user?.username || ''
  const isOwnProfile = Boolean(user) && profileUsername === user.username
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
  })
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [validationDetails, setValidationDetails] = useState([])
  const [loadedUsername, setLoadedUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetchUserProfile(profileUsername, token)
      .then(({ user: profileUser }) => {
        if (!isMounted) {
          return
        }

        setProfile(profileUser)
        setLoadError('')
        setSaveError('')
        setSaveMessage('')
        setValidationDetails([])
        setLoadedUsername(profileUsername)

        if (isOwnProfile) {
          setForm({
            displayName: profileUser.displayName || '',
            bio: profileUser.bio || '',
          })
        }
      })
      .catch((requestError) => {
        if (!isMounted) {
          return
        }

        setProfile(null)
        setLoadError(requestError.message)
        setSaveError('')
        setSaveMessage('')
        setValidationDetails([])
        setLoadedUsername(profileUsername)
      })

    return () => {
      isMounted = false
    }
  }, [isOwnProfile, profileUsername, token])

  const isLoading = loadedUsername !== profileUsername

  const avatarLabel = useMemo(() => {
    return buildAvatarLabel(profile?.displayName, profile?.username)
  }, [profile?.displayName, profile?.username])

  const handleChange = (event) => {
    setSaveError('')
    setSaveMessage('')
    setValidationDetails([])

    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSaveError('')
    setSaveMessage('')
    setValidationDetails([])

    try {
      const result = await updateCurrentUserProfile(
        {
          displayName: form.displayName,
          bio: form.bio,
        },
        token,
      )

      updateUser(result.user)
      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              displayName: result.user.displayName,
              bio: result.user.bio,
            }
          : currentProfile,
      )
      setSaveMessage(result.message)
    } catch (requestError) {
      const details = Array.isArray(requestError.payload?.details)
        ? requestError.payload.details
        : []

      setValidationDetails(details)
      setSaveError(details.length > 0 ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] text-sm font-medium text-[#27352f]">
        Loading profile
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
        <section className="w-full max-w-lg rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
            Trackscendence
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Profile unavailable</h1>
          <p className="mt-4 rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
            {loadError || 'User not found'}
          </p>
          <button
            className="mt-5 rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to session
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-5 py-8 text-[#1f2d28]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2f7d61] text-2xl font-semibold text-white shadow-sm">
                {avatarLabel}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
                  Trackscendence
                </p>
                <h1 className="mt-2 text-3xl font-semibold">
                  {profile.displayName || profile.username}
                </h1>
                <p className="mt-1 text-sm text-[#5d6d65]">
                  @{profile.username}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-[#d9dfd3] bg-[#f7faf5] px-3 py-1 font-medium text-[#44534b]">
                    {formatRank(profile.stats.rank)}
                  </span>
                  <span className="rounded-full border border-[#d9dfd3] bg-[#f7faf5] px-3 py-1 font-medium text-[#44534b]">
                    Joined{' '}
                    {joinedDateFormatter.format(new Date(profile.createdAt))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
                type="button"
                onClick={() => navigate('/')}
              >
                Back to session
              </button>
              {isOwnProfile ? (
                <button
                  className="rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
                  type="button"
                  onClick={() => navigate('/change-password')}
                >
                  Change password
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px),minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                {isOwnProfile ? 'Account settings' : 'Player snapshot'}
              </h2>
              <div className="mt-5 grid gap-4">
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">
                    Display name
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {profile.displayName || 'Using username as public name'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">Username</p>
                  <p className="mt-1 text-base font-semibold">
                    @{profile.username}
                  </p>
                </div>
                {isOwnProfile ? (
                  <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-medium text-[#617267]">Email</p>
                    <p className="mt-1 text-base font-semibold">{user.email}</p>
                  </div>
                ) : null}
              </div>
            </section>

            {isOwnProfile ? (
              <section className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Edit profile</h2>
                <p className="mt-2 text-sm text-[#5d6d65]">
                  Update the public details shown on your player card.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="text-sm font-medium">Display name</span>
                    <input
                      className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                      name="displayName"
                      type="text"
                      value={form.displayName}
                      onChange={handleChange}
                      placeholder="How your name appears to other players"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Bio</span>
                    <textarea
                      className="mt-2 min-h-32 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      placeholder="Add a short note about your play style, favorite mode, or goals."
                    />
                  </label>

                  {validationDetails.length > 0 ? (
                    <div className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
                      {validationDetails.map((detail) => (
                        <p key={detail}>{detail}</p>
                      ))}
                    </div>
                  ) : null}

                  {saveError ? (
                    <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
                      {saveError}
                    </p>
                  ) : null}

                  {saveMessage ? (
                    <p className="rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
                      {saveMessage}
                    </p>
                  ) : null}

                  <button
                    className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving profile' : 'Save profile'}
                  </button>
                </form>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-3 text-sm leading-6 text-[#42524a]">
                {profile.bio || 'No bio added yet.'}
              </p>
            </section>

            <section className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Lifetime stats</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">
                    Games played
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {profile.stats.gamesPlayed}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">Wins</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {profile.stats.wins}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">Losses</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {profile.stats.losses}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-medium text-[#617267]">Rank</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatRank(profile.stats.rank)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#d8dfd4] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Match history</h2>
                  <p className="mt-1 text-sm text-[#5d6d65]">
                    The 10 most recent recorded games for this player.
                  </p>
                </div>
              </div>

              {profile.recentMatches.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-[#d6ddd2] bg-[#f8faf7] px-4 py-5 text-sm text-[#5d6d65]">
                  No saved matches yet.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {profile.recentMatches.map((match) => (
                    <article
                      key={match.gameId}
                      className="rounded-xl border border-[#e1e6de] bg-[#fbfcfa] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.04em] ${getResultPalette(match.result)}`}
                            >
                              {match.result}
                            </span>
                            <span className="text-sm text-[#5d6d65]">
                              {matchDateFormatter.format(
                                new Date(match.endedAt || match.startedAt),
                              )}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-medium text-[#617267]">
                            Opponents
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {match.opponents.map((opponent) => (
                              <Link
                                key={opponent.id}
                                className="rounded-full border border-[#d2dacf] bg-white px-3 py-1 text-sm font-medium text-[#2f6f86] transition hover:border-[#2f6f86] hover:text-[#24586a]"
                                to={`/users/${encodeURIComponent(opponent.username)}`}
                              >
                                {opponent.displayName || opponent.username}
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="grid min-w-44 gap-3 sm:text-right">
                          <div>
                            <p className="text-sm font-medium text-[#617267]">
                              Your score
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                              {match.score}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#617267]">
                              Match status
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {match.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfilePage
