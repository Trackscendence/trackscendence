import { Link } from 'react-router-dom'

// Full-screen failure state for the 42 callback. It carries its own warm
// surface because the callback route sits outside Authentication (no shared header).
const OAuth42Error = ({ message }) => (
  <div className="bg-surface-warm flex min-h-[100dvh] items-center justify-center px-4 py-8 text-[#081934] sm:px-5 sm:py-10">
    <div className="w-full max-w-[414px] text-center">
      <h1 className="mb-4 text-3xl font-semibold text-[#081934]">
        42 sign-in failed
      </h1>
      <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
        {message}
      </p>
      <p className="mt-5 text-sm text-[#081934]">
        <Link
          className="font-semibold text-[#0196FF] hover:text-[#0080e0]"
          to="/login"
        >
          Back to log in
        </Link>
      </p>
    </div>
  </div>
)

export default OAuth42Error
