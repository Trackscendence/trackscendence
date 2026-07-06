import Draw2Center from '@/assets/cards/symbols/draw2-center.svg?react'
import ReverseCenter from '@/assets/cards/symbols/reverse-center.svg?react'
import SkipCenter from '@/assets/cards/symbols/skip-center.svg?react'
import WildCenter from '@/assets/cards/symbols/wildcard-center.svg?react'
import WildDraw3Center from '@/assets/cards/symbols/wildcard-draw3-center.svg?react'
import WildDraw4Center from '@/assets/cards/symbols/wildcard-draw4-center.svg?react'
import Corners from './_components/Corners'

const SYMBOLS = {
  skip: {
    Center: SkipCenter,
    centerClass: 'h-16 w-16',
    corners: { type: 'skip' },
  },
  reverse: {
    Center: ReverseCenter,
    centerClass: 'h-16 w-16',
    centerProps: { viewBox: '29 63 64 64' },
    corners: { type: 'reverse' },
  },
  draw2: {
    Center: Draw2Center,
    centerClass: 'h-[76px] w-[60px]',
    corners: { label: '+2' },
  },
  wild: {
    Center: WildCenter,
    centerClass: 'h-[99px] w-[99px]',
    corners: { type: 'wild' },
  },
  wild_draw3: {
    Center: WildDraw3Center,
    centerClass: 'h-[89px] w-[60px]',
    corners: { label: '+3' },
  },
  wild_draw4: {
    Center: WildDraw4Center,
    centerClass: 'h-[89px] w-[67px]',
    corners: { label: '+4' },
  },
}

const Symbol = ({ colorClass = '', type }) => {
  const symbol = SYMBOLS[type]
  if (!symbol) return null

  const { Center, centerClass, centerProps = {}, corners } = symbol

  return (
    <>
      <Corners {...corners} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[99px] w-[99px] items-center justify-center">
          <div className="absolute h-[70px] w-[70px] rotate-45 bg-white" />
          <Center
            {...centerProps}
            aria-hidden="true"
            className={`relative z-10 ${centerClass} ${colorClass}`}
            focusable="false"
          />
        </div>
      </div>
    </>
  )
}

export default Symbol
