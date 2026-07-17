import Url from '@/components/Url'

// Private to Layout: the app-wide footer. It carries no background of its own,
// so it blends into whatever surface the page set, and mt-auto pins it to the
// bottom of Layout's flex column. The legal links keep Privacy Policy and Terms
// of Service reachable from the app chrome (an evaluation requirement).
const Footer = () => (
  <footer className="mt-auto px-4 py-5 sm:px-8">
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-xs">
      <Url to="/privacy-policy" variant="muted">
        Privacy Policy
      </Url>
      <Url to="/terms-of-service" variant="muted">
        Terms of Service
      </Url>
    </div>
  </footer>
)

export default Footer
