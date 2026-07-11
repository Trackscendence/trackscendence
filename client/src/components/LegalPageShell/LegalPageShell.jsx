import Url from '@/components/Url'

const LegalPageShell = ({ children, footerLinks, lastUpdated, title }) => {
  return (
    <main className="min-h-screen bg-[#f4f7f2] px-5 py-12 text-[#1f2d28]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
          Trackscendence
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[#50635a]">
          Last updated: {lastUpdated}
        </p>

        <div className="prose mt-8 space-y-8 text-sm leading-relaxed text-[#27352f] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#1f2d28] [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>

        <p className="mt-10 text-sm text-[#50635a]">
          {footerLinks.map((link, index) => (
            <span key={link.to}>
              {index > 0 ? ' · ' : ''}
              <Url to={link.to} variant="legal">
                {link.label}
              </Url>
            </span>
          ))}
        </p>
      </div>
    </main>
  )
}

export default LegalPageShell
