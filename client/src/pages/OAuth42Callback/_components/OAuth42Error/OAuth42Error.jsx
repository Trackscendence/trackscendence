import AuthLayout from '@/layouts/AuthLayout'
import Url from '@/components/Url'

const OAuth42Error = ({ message }) => (
  <AuthLayout showHeader={false} contentClassName="text-center">
    <h1 className="mb-4 text-3xl font-semibold text-[#081934]">
      42 sign-in failed
    </h1>
    <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
      {message}
    </p>
    <p className="mt-5 text-sm text-[#081934]">
      <Url to="/login">Back to log in</Url>
    </p>
  </AuthLayout>
)

export default OAuth42Error
