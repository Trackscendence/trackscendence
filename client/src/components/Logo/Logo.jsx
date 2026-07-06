import unoLogo from '@/assets/lobby/uno-logo.png'

// The app's UNO! logo: the lettering on a single warm-orange disc, shown in the
// lobby nav at 60px. The four-colour roundel it replaces lives on as the favicon.
const Logo = () => (
  <img
    src={unoLogo}
    alt="UNO!"
    width={60}
    height={60}
    className="h-[60px] w-[60px] rounded-full object-contain"
  />
)

export default Logo
