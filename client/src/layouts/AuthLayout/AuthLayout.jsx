import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
      <Outlet />
    </main>
  )
}

export default AuthLayout
