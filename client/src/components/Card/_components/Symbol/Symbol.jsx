import Draw2Center from '@/assets/cards/symbols/draw2-center.svg?react'
import Draw2Corners from '@/assets/cards/symbols/draw2-corners.svg?react'
import ReverseCenter from '@/assets/cards/symbols/reverse-center.svg?react'
import ReverseCorners from '@/assets/cards/symbols/reverse-corners.svg?react'
import SkipCenter from '@/assets/cards/symbols/skip-center.svg?react'
import SkipCorners from '@/assets/cards/symbols/skip-corners.svg?react'
import WildCenter from '@/assets/cards/symbols/wildcard-center.svg?react'
import WildCorners from '@/assets/cards/symbols/wildcard-corners.svg?react'
import WildDraw3Center from '@/assets/cards/symbols/wildcard-draw3-center.svg?react'
import WildDraw3Corners from '@/assets/cards/symbols/wildcard-draw3-corners.svg?react'

const SYMBOLS = {
  skip: {
    Center: SkipCenter,
    Corners: SkipCorners,
    centerClass: 'h-16 w-16',
    cornersClass: 'left-[10px] top-[9px] h-[187px] w-[122px]',
  },
  reverse: {
    Center: ReverseCenter,
    Corners: ReverseCorners,
    centerClass: 'h-16 w-16',
    centerProps: { viewBox: '29 63 64 64' },
    cornersClass: 'left-[10px] top-2 h-[189px] w-[122px]',
  },
  draw2: {
    Center: Draw2Center,
    Corners: Draw2Corners,
    centerClass: 'h-[76px] w-[60px]',
    cornersClass: 'left-2 top-0.5 h-[197px] w-[130px]',
  },
  wild: {
    Center: WildCenter,
    Corners: WildCorners,
    centerClass: 'h-[99px] w-[99px]',
    cornersClass: 'left-1 top-2 h-[189px] w-[134px]',
  },
  wild_draw3: {
    Center: WildDraw3Center,
    Corners: WildDraw3Corners,
    centerClass: 'h-[89px] w-[60px]',
    cornersClass: 'left-2 top-0.5 h-[197px] w-[130px]',
  },
}

const Symbol = ({ type }) => {
  const symbol = SYMBOLS[type]
  if (!symbol) return null

  const {
    Center,
    Corners,
    centerClass,
    centerProps = {},
    cornersClass,
  } = symbol

  return (
    <>
      <Corners
        aria-hidden="true"
        className={`pointer-events-none absolute ${cornersClass}`}
        focusable="false"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[99px] w-[99px] items-center justify-center">
          <div className="absolute h-[70px] w-[70px] rotate-45 bg-white" />
          <Center
            {...centerProps}
            aria-hidden="true"
            className={`relative z-10 ${centerClass}`}
            focusable="false"
          />
        </div>
      </div>
    </>
  )
}

export default Symbol
