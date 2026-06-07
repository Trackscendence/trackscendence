
import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="text-sm text-gray-500 hover:text-gray-900">
            Terms of Service
          </Link>
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} Trackscendence (42 London). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
