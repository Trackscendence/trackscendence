import { useRef } from 'react'
import Avatar from '@/components/Avatar'

// Mirrors the server's avatar rules (server/src/modules/users/users.avatar.js):
// JPEG or PNG, up to 2 MB. Validated here too so an obviously bad file never
// leaves the browser.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png']

const AvatarUploader = ({
  avatarUrl,
  initials,
  isBusy,
  onInvalidFile,
  onRemove,
  onUpload,
}) => {
  const inputRef = useRef(null)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    // Let the same file be re-picked after a failed attempt.
    event.target.value = ''

    if (!file) return

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      onInvalidFile('Use a JPEG or PNG image.')
      return
    }

    if (file.size > AVATAR_MAX_BYTES) {
      onInvalidFile('Keep the image under 2 MB.')
      return
    }

    onUpload(file)
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      <Avatar
        alt="Your avatar"
        initials={initials}
        size={96}
        src={avatarUrl || undefined}
      />

      <div className="flex w-full flex-col gap-2 sm:w-auto">
        <div className="flex flex-wrap gap-2">
          <button
            className="w-full rounded-xl bg-[#E8893A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#cf7526] focus-visible:ring-2 focus-visible:ring-[#E8893A] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isBusy}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {avatarUrl ? 'Change photo' : 'Upload photo'}
          </button>

          {avatarUrl ? (
            <button
              className="w-full rounded-xl border border-[#e2b3a3] px-4 py-2 text-sm font-semibold text-[#b6523b] transition hover:bg-[#fff1ed] focus-visible:ring-2 focus-visible:ring-[#b6523b] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isBusy}
              type="button"
              onClick={onRemove}
            >
              Remove
            </button>
          ) : null}
        </div>

        <p className="text-xs text-[#8a6845]">JPEG or PNG, up to 2 MB.</p>

        <input
          ref={inputRef}
          accept="image/jpeg,image/png"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

export default AvatarUploader
