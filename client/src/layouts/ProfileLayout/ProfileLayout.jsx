import { Link, Outlet, useNavigate } from 'react-router-dom'

const ProfileLayout = () => {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#1f2d28]">
      <button
        className="absolute top-0 left-0 z-20 flex h-[27px] w-[138px] items-center justify-center gap-1 border-2 border-black bg-white text-sm font-semibold text-black uppercase transition hover:bg-black hover:text-white focus:ring-2 focus:ring-black/25 focus:outline-none"
        type="button"
        onClick={() => navigate(-1)}
      >
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M10 3 5 8l5 5M5.5 8H14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        Back
      </button>

      <Link
        className="absolute top-0 right-0 z-20 flex h-[27px] w-[138px] items-center justify-center gap-1 bg-black text-sm font-semibold text-white uppercase transition hover:bg-[#f2652a] focus:ring-2 focus:ring-[#f2652a]/35 focus:outline-none"
        to="/lobby"
      >
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M4 3l9 9M12 3 3 12M3 3l2 2M13 3l-2 2M3 13l2-2M13 13l-2-2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        Lobby
      </Link>

      <main className="w-full flex-1 px-5 pt-[69px] pb-12">
        <div className="mx-auto w-full max-w-[1344px]">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="flex w-full items-center justify-center gap-6 px-5 text-xs text-[#50635a]">
          <Link to="/privacy-policy" className="hover:text-[#1f2d28]">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="hover:text-[#1f2d28]">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default ProfileLayout
