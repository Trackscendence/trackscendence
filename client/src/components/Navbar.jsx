
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '@/context/useAuth'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="text-xl font-bold text-[#bd4f35] tracking-widest uppercase">
                Trackscendence
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" className="bg-[#2f7d61] hover:bg-[#276a52]">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
