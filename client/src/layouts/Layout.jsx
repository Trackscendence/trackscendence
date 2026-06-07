
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f2]">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
