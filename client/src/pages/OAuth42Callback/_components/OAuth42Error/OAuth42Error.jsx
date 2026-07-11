import AuthPageShell from '@/components/AuthPageShell'
import Url from '@/components/Url'

// Full-screen failure state for the 42 callback. It carries its own warm
// surface because the callback route sits outside AuthLayout (no shared header).
const OAuth42Error = ({ message }) => (
  <AuthPageShell fullScreen contentClassName="text-center">
    <h1 className="mb-4 text-3xl font-semibold text-[#081934]">
      42 sign-in failed
    </h1>
    <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
      {message}
    </p>
    <p className="mt-5 text-sm text-[#081934]">
      <Url to="/login">Back to log in</Url>
    </p>
  </AuthPageShell>
)

export default OAuth42Error
