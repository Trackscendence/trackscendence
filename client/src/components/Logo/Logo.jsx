import unoLogoPng from '@/assets/lobby/uno-logo.png'
import unoLogoSvg from '@/assets/lobby/uno-logo.svg'
import useLogoStore from '@/stores/useLogoStore'

// The app's UNO logo. Reads the chosen variant from useLogoStore so the dev
// Controls panel can swap it live; production stays on the default 'text' badge
// because nothing outside the (dev-only) panel ever changes the store.
//
// 'text' is the original lettered badge; 'png' is the raster art; 'svg' is the
// traced vector (kept for comparison — it renders poorly, which is the point of
// the switch). All three fill the same 60px round footprint so the nav layout
// never shifts between them.
const LOGO_SOURCES = {
  png: unoLogoPng,
  svg: unoLogoSvg,
}

const Logo = () => {
  const variant = useLogoStore((state) => state.variant)
  const src = LOGO_SOURCES[variant]

  if (src) {
    return (
      <img
        src={src}
        alt="UNO"
        width={60}
        height={60}
        className="h-[60px] w-[60px] rounded-full object-contain"
      />
    )
  }

  return (
    <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#D9D9D9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
      <span className="text-lg font-black tracking-[-0.05em] text-white">
        UNO
      </span>
    </div>
  )
}

export default Logo
