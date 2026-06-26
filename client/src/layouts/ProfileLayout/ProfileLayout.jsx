import { Link, Outlet } from 'react-router-dom'

const ProfileLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f2] text-[#1f2d28]">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-[#d8dfd4] bg-white py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-6 px-5 text-xs text-[#50635a]">
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
