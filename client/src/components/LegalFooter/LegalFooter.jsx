import { Link } from 'react-router-dom'

const LegalFooter = () => (
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
)

export default LegalFooter
