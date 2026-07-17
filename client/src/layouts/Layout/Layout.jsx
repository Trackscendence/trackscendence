import Header from './_components/Header'
import Footer from './_components/Footer'

// The shell for the signed-in game surface: an optional header, the page's own
// content, then the blended footer. It is used as a wrapper — <Layout>…</Layout>
// — rather than an Outlet route so each page keeps control of its own
// background (the warm lobby, the waiting-room and outcome surfaces), which the
// footer then blends into. Pass showHeader={false} for the immersive screens
// that keep the footer but not the top navigation. The game table opts out of
// the chrome entirely by not using Layout at all.
const Layout = ({
  children,
  className = 'bg-surface-warm',
  showHeader = true,
}) => (
  <div className={`flex min-h-[100dvh] flex-col ${className}`}>
    {showHeader ? <Header /> : null}
    {children}
    <Footer />
  </div>
)

export default Layout
